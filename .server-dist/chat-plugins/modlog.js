"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }/**
 * Modlog
 * Pokemon Showdown - http://pokemonshowdown.com/
 *
 * Interface for viewing and searching modlog. These run in a
 * subprocess.
 *
 * Also handles searching battle logs.
 *
 * Actually writing to modlog is handled in chat.js, rooms.js, and
 * roomlogs.js
 *
 * @license MIT
 */

var _child_process = require('child_process'); var child_process = _child_process;
var _path = require('path'); var path = _path;
var _util = require('util'); var util = _util;
var _dashycode = require('../../.lib-dist/dashycode'); var Dashycode = _dashycode;

var _fs = require('../../.lib-dist/fs');
var _utils = require('../../.lib-dist/utils');
var _processmanager = require('../../.lib-dist/process-manager');
var _repl = require('../../.lib-dist/repl');
var _dex = require('../../.sim-dist/dex');
var _configloader = require('../config-loader');









const execFile = util.promisify(child_process.execFile);

const MAX_PROCESSES = 1;
const MAX_QUERY_LENGTH = 2500;
const DEFAULT_RESULTS_LENGTH = 100;
const MORE_BUTTON_INCREMENTS = [200, 400, 800, 1600, 3200];
// If a modlog query takes longer than this, it will be logged.
const LONG_QUERY_DURATION = 2000;
const LINES_SEPARATOR = 'lines=';
const MAX_RESULTS_LENGTH = MORE_BUTTON_INCREMENTS[MORE_BUTTON_INCREMENTS.length - 1];
const LOG_PATH = 'logs/modlog/';

const PUNISHMENTS = [
	'ROOMBAN', 'UNROOMBAN', 'WARN', 'MUTE', 'HOURMUTE', 'UNMUTE', 'CRISISDEMOTE',
	'WEEKLOCK', 'LOCK', 'UNLOCK', 'UNLOCKNAME', 'UNLOCKRANGE', 'UNLOCKIP', 'BAN',
	'UNBAN', 'RANGEBAN', 'UNRANGEBAN', 'RANGELOCK', 'TRUSTUSER', 'UNTRUSTUSER',
	'FORCERENAME', 'BLACKLIST', 'BATTLEBAN', 'UNBATTLEBAN', 'NAMEBLACKLIST',
	'KICKBATTLE', 'TICKETBAN', 'UNTICKETBAN', 'HIDETEXT', 'HIDEALTSTEXT', 'REDIRECT',
	'NOTE', 'MAFIAHOSTBAN', 'MAFIAUNHOSTBAN', 'GIVEAWAYBAN', 'GIVEAWAYUNBAN',
	'TOUR BAN', 'TOUR UNBAN', 'AUTOLOCK', 'AUTONAMELOCK', 'NAMELOCK', 'UNNAMELOCK',
	'AUTOBAN', 'MONTHLOCK',
];
const PUNISHMENTS_REGEX_STRING = `\\b(${PUNISHMENTS.join('|')}):.*`;

class SortedLimitedLengthList {
	
	

	constructor(maxSize) {
		this.maxSize = maxSize;
		this.list = [];
	}

	getListClone() {
		return this.list.slice();
	}

	insert(element) {
		let insertedAt = -1;
		for (let i = this.list.length - 1; i >= 0; i--) {
			if (element.localeCompare(this.list[i]) < 0) {
				insertedAt = i + 1;
				if (i === this.list.length - 1) {
					this.list.push(element);
					break;
				}
				this.list.splice(i + 1, 0, element);
				break;
			}
		}
		if (insertedAt < 0) this.list.splice(0, 0, element);
		if (this.list.length > this.maxSize) {
			this.list.pop();
		}
	}
}

/*********************************************************
 * Modlog Functions
 *********************************************************/

function checkRipgrepAvailability() {
	if (_configloader.Config.ripgrepmodlog === undefined) {
		_configloader.Config.ripgrepmodlog = (async () => {
			try {
				await execFile('rg', ['--version'], {cwd: path.normalize(`${__dirname}/../`)});
				await execFile('tac', ['--version'], {cwd: path.normalize(`${__dirname}/../`)});
				return true;
			} catch (error) {
				return false;
			}
		})();
	}
	return _configloader.Config.ripgrepmodlog;
}

function getMoreButton(
	roomid, search, useExactSearch,
	lines, maxLines, onlyPunishments
) {
	let newLines = 0;
	for (const increase of MORE_BUTTON_INCREMENTS) {
		if (increase > lines) {
			newLines = increase;
			break;
		}
	}
	if (!newLines || lines < maxLines) {
		return ''; // don't show a button if no more pre-set increments are valid or if the amount of results is already below the max
	} else {
		if (useExactSearch) search = _utils.Utils.escapeHTML(`"${search}"`);
		return `<br /><div style="text-align:center"><button class="button" name="send" value="/${onlyPunishments ? 'punish' : 'mod'}log ${roomid}, ${search} ${LINES_SEPARATOR}${newLines}" title="View more results">Older results<br />&#x25bc;</button></div>`;
	}
}

async function runModlog(
	roomidList, searchString, exactSearch,
	maxLines, onlyPunishments
) {
	const useRipgrep = await checkRipgrepAvailability();
	let fileNameList = [];
	let checkAllRooms = false;
	for (const roomid of roomidList) {
		if (roomid === 'all') {
			checkAllRooms = true;
			const fileList = await _fs.FS.call(void 0, LOG_PATH).readdir();
			for (const file of fileList) {
				if (file !== 'README.md' && file !== 'modlog_global.txt') fileNameList.push(file);
			}
		} else {
			fileNameList.push(`modlog_${roomid}.txt`);
		}
	}
	fileNameList = fileNameList.map(filename => `${LOG_PATH}${filename}`);

	// Ensure regexString can never be greater than or equal to the value of
	// RegExpMacroAssembler::kMaxRegister in v8 (currently 1 << 16 - 1) given a
	// searchString with max length MAX_QUERY_LENGTH. Otherwise, the modlog
	// child process will crash when attempting to execute any RegExp
	// constructed with it (i.e. when not configured to use ripgrep).
	let regexString;
	if (!searchString) {
		regexString = '.';
	} else if (exactSearch) {
		regexString = searchString.replace(/[\\.+*?()|[\]{}^$]/g, '\\$&');
	} else {
		searchString = toID(searchString);
		regexString = `[^a-zA-Z0-9]${[...searchString].join('[^a-zA-Z0-9]*')}([^a-zA-Z0-9]|\\z)`;
	}
	if (onlyPunishments) regexString = `${PUNISHMENTS_REGEX_STRING}${regexString}`;

	const results = new SortedLimitedLengthList(maxLines);
	if (useRipgrep) {
		// the entire directory is searched by default, no need to list every file manually
		if (checkAllRooms) fileNameList = [LOG_PATH];
		await runRipgrepModlog(fileNameList, regexString, results, maxLines);
	} else {
		const searchStringRegex = searchString ? new RegExp(regexString, 'i') : null;
		for (const fileName of fileNameList) {
			await checkRoomModlog(fileName, searchStringRegex, results);
		}
	}
	const resultData = results.getListClone();
	return resultData;
}

async function checkRoomModlog(pathString, regex, results) {
	const fileStream = _fs.FS.call(void 0, pathString).createReadStream();
	let line;
	while ((line = await fileStream.readLine()) !== null) {
		if (!regex || regex.test(line)) {
			results.insert(line);
		}
	}
	void fileStream.destroy();
	return results;
}

async function runRipgrepModlog(paths, regexString, results, lines) {
	let output;
	try {
		const options = [
			'-i',
			'-m', '' + lines,
			'--pre', 'tac',
			'-e', regexString,
			'--no-filename',
			'--no-line-number',
			...paths,
			'-g', '!modlog_global.txt', '-g', '!README.md',
		];
		output = await execFile('rg', options, {cwd: path.normalize(`${__dirname}/../../`)});
	} catch (error) {
		return results;
	}
	for (const fileName of output.stdout.split('\n').reverse()) {
		if (fileName) results.insert(fileName);
	}
	return results;
}

function prettifyResults(
	resultArray, roomid, searchString, exactSearch,
	addModlogLinks, hideIps, maxLines, onlyPunishments
) {
	if (resultArray === null) {
		return "|popup|The modlog query crashed.";
	}
	let roomName;
	switch (roomid) {
	case 'all':
		roomName = "all rooms";
		break;
	case 'public':
		roomName = "all public rooms";
		break;
	default:
		roomName = `room ${roomid}`;
	}
	const scope = onlyPunishments ? 'punishment-related ' : '';
	if (!resultArray.length) {
		return `|popup|No ${scope}moderator actions containing ${searchString} found on ${roomName}.` +
				(exactSearch ? "" : " Add quotes to the search parameter to search for a phrase, rather than a user.");
	}
	const title = `[${roomid}]` + (searchString ? ` ${searchString}` : ``);
	const lines = resultArray.length;
	let curDate = '';
	resultArray.unshift('');
	const resultString = resultArray.map(line => {
		let time;
		let bracketIndex;
		if (line) {
			if (hideIps) line = line.replace(/[([][0-9]+\.[0-9]+\.[0-9]+\.[0-9]+[)\]]/g, '');
			bracketIndex = line.indexOf(']');
			if (bracketIndex < 0) return _utils.Utils.escapeHTML(line);
			time = new Date(line.slice(1, bracketIndex));
		} else {
			time = new Date();
		}
		let [date, timestamp] = Chat.toTimestamp(time, {human: true}).split(' ');
		if (date !== curDate) {
			curDate = date;
			date = `</p><p>[${date}]<br />`;
		} else {
			date = ``;
		}
		if (!line) {
			return `${date}<small>[${timestamp}] \u2190 current server time</small>`;
		}
		const parenIndex = line.indexOf(')');
		const thisRoomID = line.slice((bracketIndex ) + 3, parenIndex);
		if (addModlogLinks) {
			const url = _configloader.Config.modloglink(time, thisRoomID);
			if (url) timestamp = `<a href="${url}">${timestamp}</a>`;
		}
		return `${date}<small>[${timestamp}] (${thisRoomID})</small>${_utils.Utils.escapeHTML(line.slice(parenIndex + 1))}`;
	}).join(`<br />`);
	let preamble;
	const modlogid = roomid + (searchString ? '-' + Dashycode.encode(searchString) : '');
	if (searchString) {
		const searchStringDescription = exactSearch ?
			_utils.Utils.html`containing the string "${searchString}"` : _utils.Utils.html`matching the username "${searchString}"`;
		preamble = `>view-modlog-${modlogid}\n|init|html\n|title|[Modlog]${title}\n` +
			`|pagehtml|<div class="pad"><p>The last ${scope}${Chat.count(lines, "logged actions")} ${searchStringDescription} on ${roomName}.` +
			(exactSearch ? "" : " Add quotes to the search parameter to search for a phrase, rather than a user.");
	} else {
		preamble = `>view-modlog-${modlogid}\n|init|html\n|title|[Modlog]${title}\n` +
			`|pagehtml|<div class="pad"><p>The last ${Chat.count(lines, `${scope}lines`)} of the Moderator Log of ${roomName}.`;
	}
	const moreButton = getMoreButton(roomid, searchString, exactSearch, lines, maxLines, onlyPunishments);
	return `${preamble}${resultString}${moreButton}</div>`;
}

async function getModlog(
	connection, roomid = 'global', searchString = '',
	maxLines = 20, onlyPunishments = false, timed = false
) {
	const startTime = Date.now();
	const targetRoom = Rooms.search(roomid);
	const user = connection.user;

	// permission checking
	if (roomid === 'all' || roomid === 'public') {
		if (!user.can('modlog')) {
			return connection.popup("Access denied");
		}
	} else {
		if (!user.can('modlog', null, targetRoom) && !user.can('modlog')) {
			return connection.popup("Access denied");
		}
	}

	const hideIps = !user.can('lock');
	const addModlogLinks = !!(
		_configloader.Config.modloglink && (user.group !== ' ' || (targetRoom && targetRoom.settings.isPrivate !== true))
	);
	if (hideIps && /^\[?[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+\]?$/.test(searchString)) {
		connection.popup(`You cannot search for IPs.`);
		return;
	}
	if (searchString.length > MAX_QUERY_LENGTH) {
		connection.popup(`Your search query must be shorter than ${MAX_QUERY_LENGTH} characters.`);
		return;
	}

	let exactSearch = false;
	if (/^["'].+["']$/.test(searchString)) {
		exactSearch = true;
		searchString = searchString.substring(1, searchString.length - 1);
	}

	let roomidList;
	// handle this here so the child process doesn't have to load rooms data
	if (roomid === 'public') {
		roomidList = [...Rooms.rooms.values()].filter(
			room => !(room.settings.isPrivate || room.battle || room.settings.isPersonal || room.roomid === 'global')
		).map(room => room.roomid);
	} else {
		roomidList = [roomid];
	}

	const query = {cmd: 'modlog', roomidList, searchString, exactSearch, maxLines, onlyPunishments};
	const response = await exports.PM.query(query);
	connection.send(
		prettifyResults(
			response,
			roomid,
			searchString,
			exactSearch,
			addModlogLinks,
			hideIps,
			maxLines,
			onlyPunishments
		)
	);
	const duration = Date.now() - startTime;
	if (timed) connection.popup(`The modlog query took ${duration} ms to complete.`);
	if (duration > LONG_QUERY_DURATION) console.log(`Long modlog query took ${duration} ms to complete:`, query);
}

/*********************************************************
 * Battle Search Functions
 *********************************************************/

async function runBattleSearch(userid, turnLimit, month, tierid, date) {
	const useRipgrep = await checkRipgrepAvailability();
	const pathString = `logs/${month}/${tierid}/${date}`;
	const results = {
		totalBattles: 0,
		totalWins: 0,
		totalLosses: 0,
		totalTies: 0,
	};
	let files = [];
	try {
		files = await _fs.FS.call(void 0, pathString).readdir();
	} catch (err) {
		if (err.code === 'ENOENT') {
			return results;
		}
		throw err;
	}
	if (useRipgrep) {
		// Matches non-word (including _ which counts as a word) characters between letters/numbers
		// in a user's name so the userid can case-insensitively be matched to the name.
		const regexString = `("p1":"${[...userid].join('[^a-zA-Z0-9]*')}[^a-zA-Z0-9]*"|"p2":"${[...userid].join('[^a-zA-Z0-9]*')}[^a-zA-Z0-9]*")`;
		let output;
		try {
			output = await execFile('rg', ['-i', regexString, '--no-filename', '--no-line-number', '-tjson', pathString]);
		} catch (error) {
			return results;
		}
		for (const file of output.stdout.split('\n').reverse()) {
			if (!file) continue;
			const data = JSON.parse(file);
			if (data.turns > turnLimit) continue;
			results.totalBattles++;
			if (toID(data.winner) === userid) {
				results.totalWins++;
			} else if (data.winner) {
				results.totalLosses++;
			} else {
				results.totalTies++;
			}
			const foe = toID(data.p1) === userid ? toID(data.p2) : toID(data.p1);
			if (!results[foe]) results[foe] = 0;
			results[foe]++;
		}
		return results;
	}
	for (const file of files) {
		const json = await _fs.FS.call(void 0, `${pathString}/${file}`).readIfExists();
		const data = JSON.parse(json);
		if (toID(data.p1) !== userid && toID(data.p2) !== userid) continue;
		if (data.turns > turnLimit) continue;
		results.totalBattles++;
		if (toID(data.winner) === userid) {
			results.totalWins++;
		} else if (data.winner) {
			results.totalLosses++;
		} else {
			results.totalTies++;
		}
		const foe = toID(data.p1) === userid ? toID(data.p2) : toID(data.p1);
		if (!results[foe]) results[foe] = 0;
		results[foe]++;
	}
	return results;
}

function buildResults(data, userid, turnLimit, month, tierid, date) {
	let buf = `>view-battlesearch-${userid}-${turnLimit}-${month}-${tierid}-${date}-confirm\n|init|html\n|title|[Battle Search][${userid}][${tierid}][${date}]\n`;
	buf += `|pagehtml|<div class="pad ladder"><p>${tierid} battles on ${date} where ${userid} was a player and the battle lasted less than ${turnLimit} turn${Chat.plural(turnLimit)}:</p>`;
	buf += `<table style="margin-left: auto; margin-right: auto"><tbody><tr><th colspan="2"><h2 style="margin: 5px auto">${userid}'s ${tierid} Battles</h1></th></tr><tr><th>Category</th><th>Number</th></tr>`;
	buf += `<tr><td>Total Battles</td><td>${data.totalBattles}</td></tr><tr><td>Total Wins</td><td>${data.totalWins}</td></tr><tr><td>Total Losses</td><td>${data.totalLosses}</td></tr><tr><td>Total Ties</td><td>${data.totalTies}</td></tr>`;
	buf += `<tr><th>Opponent</th><th>Times Battled</th></tr>`;
	for (const foe in data) {
		if (['totalBattles', 'totalWins', 'totalLosses', 'totalTies'].includes(foe)) continue;
		buf += `<tr><td>${foe}</td><td>${data[foe]}</td></tr>`;
	}
	buf += `</tbody></table></div>`;
	return buf;
}

async function getBattleSearch(
	connection, userid, turnLimit = 1,
	month, tierid, date
) {
	const user = connection.user;
	if (!user.can('forcewin')) return connection.popup(`/battlesearch - Access Denied`);

	const response = await exports.PM.query({cmd: 'battlesearch', userid, turnLimit, month, tierid, date});
	connection.send(buildResults(response, userid, turnLimit, month, tierid, date));
}

 const pages = {
	modlog(args, user, connection) {
		if (!user.named) return Rooms.RETRY_AFTER_LOGIN;
		const roomid = args[0];
		const target = Dashycode.decode(args.slice(1).join('-'));

		void getModlog(connection, roomid , target);
	},
	async battlesearch(args, user, connection) {
		if (!user.named) return Rooms.RETRY_AFTER_LOGIN;
		if (!this.can('forcewin')) return;
		const userid = toID(args.shift());
		const turnLimit = parseInt(args.shift());
		if (!userid || !turnLimit || turnLimit < 1) {
			return user.popup(`Some arguments are missing or invalid for battlesearch. Use /battlesearch to start over.`);
		}
		this.title = `[Battle Search][${userid}]`;
		let buf = `<div class="pad ladder"><h2>Battle Search</h2><p>Userid: ${userid}</p><p>Maximum Turns: ${turnLimit}</p>`;

		const months = (await _fs.FS.call(void 0, 'logs/').readdir()).filter(f => f.length === 7 && f.includes('-')).sort((aKey, bKey) => {
			const a = aKey.split('-').map(n => parseInt(n));
			const b = bKey.split('-').map(n => parseInt(n));
			if (a[0] !== b[0]) return b[0] - a[0];
			return b[1] - a[1];
		});
		let month = args.shift();
		if (!month) {
			buf += `<p>Please select a month:</p><ul style="list-style: none; display: block; padding: 0">`;
			for (const i of months) {
				buf += `<li style="display: inline; list-style: none"><a href="/view-battlesearch-${userid}-${turnLimit}-${i}" target="replace"><button class="button">${i}</button></li>`;
			}
			return `${buf}</ul></div>`;
		} else {
			month = month += `-${args.shift()}`;
			if (!months.includes(month)) {
				return `${buf}Invalid month selected. <a href="/view-battlesearch-${userid}-${turnLimit}" target="replace"><button class="button">Back to month selection</button></a></div>`;
			}
			buf += `<p><a href="/view-battlesearch-${userid}-${turnLimit}" target="replace"><button class="button">Back</button></a> <button class="button disabled">${month}</button></p>`;
		}

		const tierid = toID(args.shift());
		const tiers = (await _fs.FS.call(void 0, `logs/${month}/`).readdir()).sort((a, b) => {
			// First sort by gen with the latest being first
			let aGen = 6;
			let bGen = 6;
			if (a.substring(0, 3) === 'gen') aGen = parseInt(a.substring(3, 4));
			if (b.substring(0, 3) === 'gen') bGen = parseInt(b.substring(3, 4));
			if (aGen !== bGen) return bGen - aGen;
			// Sort alphabetically
			const aTier = a.substring(4);
			const bTier = b.substring(4);
			if (aTier < bTier) return -1;
			if (aTier > bTier) return 1;
			return 0;
		}).map(tier => {
			// Use the official tier name
			const format = _dex.Dex.getFormat(tier);
			if (_optionalChain([format, 'optionalAccess', _ => _.exists])) tier = format.name;
			// Otherwise format as best as possible
			if (tier.substring(0, 3) === 'gen') {
				return `[Gen ${tier.substring(3, 4)}] ${tier.substring(4)}`;
			}
			return tier;
		});
		if (!tierid) {
			buf += `<p>Please select the tier to search:</p><ul style="list-style: none; display: block; padding: 0">`;
			for (const tier of tiers) {
				buf += `<li style="display: inline; list-style: none"><a href="/view-battlesearch-${userid}-${turnLimit}-${month}-${toID(tier)}" target="replace"><button class="button">${tier}</button></a></li>`;
			}
			return `${buf}</ul></div>`;
		} else {
			const tierids = tiers.map(toID);
			if (!tierids.includes(tierid)) {
				return `${buf}Invalid tier selected. <a href="/view-battlesearch-${userid}-${turnLimit}-${month}" target="replace"><button class="button">Back to tier selection</button></a></div>`;
			}
			this.title += `[${tierid}]`;
			buf += `<p><a href="/view-battlesearch-${userid}-${turnLimit}-${month}" target="replace"><button class="button">Back</button></a> <button class="button disabled">${tierid}</button></p>`;
		}

		let date = args.shift();
		const days = (await _fs.FS.call(void 0, `logs/${month}/${tierid}/`).readdir()).sort((a, b) => {
			const aNumArray = a.split('-').map(n => parseInt(n));
			const bNumArray = b.split('-').map(n => parseInt(n));
			if (aNumArray[0] !== bNumArray[0]) return bNumArray[0] - aNumArray[0];
			if (aNumArray[1] !== bNumArray[1]) return bNumArray[1] - aNumArray[1];
			return bNumArray[2] - aNumArray[2];
		});
		if (!date) {
			buf += `<p>Please select the date to search:</p><ul style="list-style: none; display: block; padding: 0">`;
			for (const day of days) {
				buf += `<li style="display: inline; list-style: none"><a href="/view-battlesearch-${userid}-${turnLimit}-${month}-${tierid}-${day}" target="replace"><button class="button">${day}</button></a></li>`;
			}
			return `${buf}</ul></div>`;
		} else {
			date = date += `-${args.shift()}-${args.shift()}`;
			if (!days.includes(date)) {
				return `${buf}Invalid date selected. <a href="/view-battlesearch-${userid}-${turnLimit}-${month}-${tierid}" target="replace"><button class="button">Back to date selection</button></a></div>`;
			}
			this.title += `[${date}]`;
			buf += `<p><a href="/view-battlesearch-${userid}-${turnLimit}-${month}-${tierid}" target="replace"><button class="button">Back</button></a> <button class="button disabled">${date}</button></p>`;
		}

		if (args[0] !== 'confirm') {
			buf += `<p>Are you sure you want to run a battle search for for ${tierid} battles on ${date} where ${userid} was a player and the battle lasted less than ${turnLimit} turn${Chat.plural(turnLimit)}?</p>`;
			buf += `<p><a href="/view-battlesearch-${userid}-${turnLimit}-${month}-${tierid}-${date}-confirm" target="replace"><button class="button notifying">Yes, run the battle search</button></a> <a href="/view-battlesearch-${userid}-${turnLimit}-${month}-${tierid}" target="replace"><button class="button">No, go back</button></a></p>`;
			return `${buf}</div>`;
		}

		// Run search
		void getBattleSearch(connection, userid, turnLimit, month, tierid, date);
		return `<div class="pad ladder"><h2>Battle Search</h2><p>Searching for ${tierid} battles on ${date} where ${userid} was a player and the battle lasted less than ${turnLimit} turn${Chat.plural(turnLimit)}.</p><p>Loading... (this will take a while)</p></div>`;
	},
}; exports.pages = pages;

 const commands = {
	ml: 'modlog',
	punishlog: 'modlog',
	pl: 'modlog',
	timedmodlog: 'modlog',
	modlog(target, room, user, connection, cmd) {
		let roomid = (!room || room.roomid === 'staff' ? 'global' : room.roomid);

		if (target.includes(',')) {
			const targets = target.split(',');
			target = targets[1].trim();
			const newid = toID(targets[0]) ;
			if (newid) roomid = newid;
		}

		const targetRoom = Rooms.search(roomid);
		// if a room alias was used, replace alias with actual id
		if (targetRoom) roomid = targetRoom.roomid;

		if (roomid.includes('-')) {
			if (user.can('modlog')) {
				// default to global modlog for staff convenience
				roomid = 'global';
			} else {
				return this.errorReply(`Access to global modlog denied. Battles and groupchats (and other rooms with - in their ID) don't have individual modlogs.`);
			}
		}

		let lines;
		if (target.includes(LINES_SEPARATOR)) { // undocumented line specification
			const reqIndex = target.indexOf(LINES_SEPARATOR);
			const requestedLines = parseInt(target.substr(reqIndex + LINES_SEPARATOR.length, target.length));
			if (isNaN(requestedLines) || requestedLines < 1) {
				this.errorReply(`${LINES_SEPARATOR}${requestedLines} is not a valid line count.`);
				return;
			}
			lines = requestedLines;
			target = target.substr(0, reqIndex).trim(); // strip search out
		}

		if (!target && !lines) {
			lines = 20;
		}
		if (!lines) lines = DEFAULT_RESULTS_LENGTH;
		if (lines > MAX_RESULTS_LENGTH) lines = MAX_RESULTS_LENGTH;

		void getModlog(
			connection,
			roomid,
			target,
			lines,
			(cmd === 'punishlog' || cmd === 'pl'),
			cmd === 'timedmodlog'
		);
	},
	modloghelp: [
		`/modlog OR /ml [roomid], [search] - Searches the moderator log - defaults to the current room unless specified otherwise.`,
		`If you set [roomid] as [all], it searches for [search] on all rooms' moderator logs.`,
		`If you set [roomid] as [public], it searches for [search] in all public rooms' moderator logs, excluding battles. Requires: % @ # &`,
	],

	battlesearch(target, room, user, connection) {
		if (!target.trim()) return this.parse('/help battlesearch');
		if (!this.can('forcewin')) return;

		const userid = toID(target.split(',')[0]);
		let turnLimit = parseInt(target.split(',')[1]);
		if (!userid) return this.parse('/help battlesearch');
		if (!turnLimit) {
			turnLimit = 1;
		} else {
			if (isNaN(turnLimit) || turnLimit < 1) {
				return this.errorReply(`The turn limit should be a number that is greater than 0.`);
			}
		}
		// Selection on month, tier, and date will be handled in the HTML room
		return this.parse(`/join view-battlesearch-${userid}-${turnLimit}`);
	},
	battlesearchhelp: [
		'/battlesearch [user], (turn limit) - Searches a users rated battle history and returns information on battles that ended in less than (turn limit or 1) turns. Requires &',
	],
}; exports.commands = commands;

/*********************************************************
 * Process manager
 *********************************************************/

 const PM = new _processmanager.QueryProcessManager(module, async data => {
	switch (data.cmd) {
	case 'modlog':
		const {roomidList, searchString, exactSearch, maxLines, onlyPunishments} = data;
		try {
			return await runModlog(roomidList, searchString, exactSearch, maxLines, onlyPunishments);
		} catch (err) {
			Monitor.crashlog(err, 'A modlog query', {
				roomidList,
				searchString,
				exactSearch,
				maxLines,
			});
		}
		break;
	case 'battlesearch':
		const {userid, turnLimit, month, tierid, date} = data;
		try {
			return await runBattleSearch(userid, turnLimit, month, tierid, date);
		} catch (err) {
			Monitor.crashlog(err, 'A battle search query', {
				userid,
				turnLimit,
				month,
				tierid,
				date,
			});
		}
		break;
	}
	return null;
}); exports.PM = PM;

if (!exports.PM.isParentProcess) {
	// This is a child process!
	global.Config = _configloader.Config;
	// @ts-ignore ???
	global.Monitor = {
		crashlog(error, source = 'A modlog process', details = null) {
			const repr = JSON.stringify([error.name, error.message, source, details]);
			// @ts-ignore
			process.send(`THROW\n@!!@${repr}\n${error.stack}`);
		},
	};
	process.on('uncaughtException', err => {
		if (_configloader.Config.crashguard) {
			Monitor.crashlog(err, 'A modlog child process');
		}
	});
	global.Dex = _dex.Dex;
	global.toID = _dex.Dex.getId;
	// eslint-disable-next-line no-eval
	_repl.Repl.start('modlog', cmd => eval(cmd));
} else {
	exports.PM.spawn(MAX_PROCESSES);
}
