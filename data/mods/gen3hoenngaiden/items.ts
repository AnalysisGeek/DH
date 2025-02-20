export const Items: {[k: string]: ModdedItemData} = {
	aguavberry: {
		inherit: true,
		onUpdate() {},
		onResidualOrder: 5,
		onResidual(pokemon) {
			if (pokemon.hp <= pokemon.maxhp / 2) {
				pokemon.eatItem();
			}
		},
	},
	apicotberry: {
		inherit: true,
		onUpdate() {},
		onResidualOrder: 5,
		onResidual(pokemon) {
			if (pokemon.hp <= pokemon.maxhp / 4) {
				pokemon.eatItem();
			}
		},
	},
	berryjuice: {
		inherit: true,
		onUpdate() {},
		onResidualOrder: 5,
		onResidual(pokemon) {
			if (pokemon.hp <= pokemon.maxhp / 2) {
				if (this.runEvent('TryHeal', pokemon) && pokemon.useItem()) {
					this.heal(20);
				}
			}
		},
		isNonstandard: "Unobtainable",
	},
	blackbelt: {
		inherit: true,
		desc: "Holder's Fighting-type attacks have 1.1x power.",
		onBasePower(basePower, user, target, move) {
			if (move && move.type === 'Fighting') {
				return basePower * 1.1;
			}
		},
	},
	blackglasses: {
		inherit: true,
		desc: "Holder's Dark-type attacks have 1.1x power.",
		onBasePower(basePower, user, target, move) {
			if (move && move.type === 'Dark') {
				return basePower * 1.1;
			}
		},
	},
	charcoal: {
		inherit: true,
		desc: "Holder's Fire-type attacks have 1.1x power.",
		onBasePower(basePower, user, target, move) {
			if (move && move.type === 'Fire') {
				return basePower * 1.1;
			}
		},
	},
	dragonfang: {
		inherit: true,
		desc: "Holder's Dragon-type attacks have 1.1x power.",
		onBasePower(basePower, user, target, move) {
			if (move && move.type === 'Dragon') {
				return basePower * 1.1;
			}
		},
	},
	enigmaberry: {
		name: "Enigma Berry",
		desc: "No competitive use.",
		spritenum: 124,
		isBerry: true,
		num: 208,
		gen: 3,
		isNonstandard: "Unobtainable",
	},
	figyberry: {
		inherit: true,
		onUpdate() {},
		onResidualOrder: 5,
		onResidual(pokemon) {
			if (pokemon.hp <= pokemon.maxhp / 2) {
				pokemon.eatItem();
			}
		},
	},
	ganlonberry: {
		inherit: true,
		onUpdate() {},
		onResidualOrder: 5,
		onResidual(pokemon) {
			if (pokemon.hp <= pokemon.maxhp / 4) {
				pokemon.eatItem();
			}
		},
	},
	hardstone: {
		inherit: true,
		desc: "Holder's Rock-type attacks have 1.1x power.",
		onBasePower(basePower, user, target, move) {
			if (move && move.type === 'Rock') {
				return basePower * 1.1;
			}
		},
	},
	iapapaberry: {
		inherit: true,
		onUpdate() {},
		onResidualOrder: 5,
		onResidual(pokemon) {
			if (pokemon.hp <= pokemon.maxhp / 2) {
				pokemon.eatItem();
			}
		},
	},
	kingsrock: {
		inherit: true,
		onModifyMove(move) {
			const affectedByKingsRock = [
				'aerialace', 'aeroblast', 'aircutter', 'armthrust', 'barrage', 'beatup', 'bide', 'bind', 'blastburn', 'bonerush', 'bonemerang', 'bounce', 'brickbreak', 'bulletseed', 'clamp', 'cometpunch', 'crabhammer', 'crosschop', 'cut', 'dig', 'dive', 'doublekick', 'doubleslap', 'doubleedge', 'dragonbreath', 'dragonclaw', 'dragonrage', 'drillpeck', 'earthquake', 'eggbomb', 'endeavor', 'eruption', 'explosion', 'extremespeed', 'falseswipe', 'feintattack', 'firespin', 'flail', 'fly', 'frenzyplant', 'frustration', 'furyattack', 'furycutter', 'furyswipes', 'gust', 'hiddenpower', 'highjumpkick', 'hornattack', 'hydrocannon', 'hydropump', 'hyperbeam', 'iceball', 'iciclespear', 'jumpkick', 'karatechop', 'leafblade', 'lowkick', 'machpunch', 'magicalleaf', 'magnitude', 'megakick', 'megapunch', 'megahorn', 'meteormash', 'mudshot', 'muddywater', 'nightshade', 'outrage', 'overheat', 'payday', 'peck', 'petaldance', 'pinmissile', 'poisontail', 'pound', 'psychoboost', 'psywave', 'quickattack', 'rage', 'rapidspin', 'razorleaf', 'razorwind', 'return', 'revenge', 'reversal', 'rockblast', 'rockthrow', 'rollingkick', 'rollout', 'sandtomb', 'scratch', 'seismictoss', 'selfdestruct', 'shadowpunch', 'shockwave', 'signalbeam', 'silverwind', 'skullbash', 'skyattack', 'skyuppercut', 'slam', 'slash', 'snore', 'solarbeam', 'sonicboom', 'spikecannon', 'spitup', 'steelwing', 'strength', 'struggle', 'submission', 'surf', 'swift', 'tackle', 'takedown', 'thrash', 'tickle', 'triplekick', 'twister', 'uproar', 'visegrip', 'vinewhip', 'vitalthrow', 'volttackle', 'watergun', 'waterpulse', 'waterfall', 'weatherball', 'whirlpool', 'wingattack', 'wrap',
			];
			if (affectedByKingsRock.includes(move.id)) {
				if (!move.secondaries) move.secondaries = [];
				move.secondaries.push({
					chance: 10,
					volatileStatus: 'flinch',
				});
			}
		},
	},
	lansatberry: {
		inherit: true,
		onUpdate() {},
		onResidualOrder: 5,
		onResidual(pokemon) {
			if (pokemon.hp <= pokemon.maxhp / 4) {
				pokemon.eatItem();
			}
		},
	},
	laxincense: {
		inherit: true,
		desc: "The accuracy of attacks against the holder is 0.95x.",
		onModifyAccuracy(accuracy) {
			if (typeof accuracy !== 'number') return;
			this.debug('lax incense - decreasing accuracy');
			return accuracy * 0.95;
		},
	},
	liechiberry: {
		inherit: true,
		onUpdate() {},
		onResidualOrder: 5,
		onResidual(pokemon) {
			if (pokemon.hp <= pokemon.maxhp / 4) {
				pokemon.eatItem();
			}
		},
	},
	lightball: {
		inherit: true,
		desc: "If held by a Pikachu, its Special Attack is doubled.",
		onModifyAtk() {},
	},
	magnet: {
		inherit: true,
		desc: "Holder's Electric-type attacks have 1.1x power.",
		onBasePower(basePower, user, target, move) {
			if (move.type === 'Electric') {
				return basePower * 1.1;
			}
		},
	},
	magoberry: {
		inherit: true,
		onUpdate() {},
		onResidualOrder: 5,
		onResidual(pokemon) {
			if (pokemon.hp <= pokemon.maxhp / 2) {
				pokemon.eatItem();
			}
		},
	},
	metalcoat: {
		inherit: true,
		desc: "Holder's Steel-type attacks have 1.1x power. Evolves Onix into Steelix and Scyther into Scizor when traded.",
		shortDesc: "Holder's Steel-type attacks have 1.1x power.",
		onBasePower(basePower, user, target, move) {
			if (move.type === 'Steel') {
				return basePower * 1.1;
			}
		},
	},
	miracleseed: {
		inherit: true,
		desc: "Holder's Grass-type attacks have 1.1x power.",
		onBasePower(basePower, user, target, move) {
			if (move.type === 'Grass') {
				return basePower * 1.1;
			}
		},
	},
	mysticwater: {
		inherit: true,
		desc: "Holder's Water-type attacks have 1.1x power.",
		onBasePower(basePower, user, target, move) {
			if (move.type === 'Water') {
				return basePower * 1.1;
			}
		},
	},
	nevermeltice: {
		inherit: true,
		desc: "Holder's Ice-type attacks have 1.1x power.",
		onBasePower(basePower, user, target, move) {
			if (move.type === 'Ice') {
				return basePower * 1.1;
			}
		},
	},
	oranberry: {
		inherit: true,
		onUpdate() {},
		onResidualOrder: 5,
		onResidual(pokemon) {
			if (pokemon.hp <= pokemon.maxhp / 2) {
				pokemon.eatItem();
			}
		},
	},
	petayaberry: {
		inherit: true,
		onUpdate() {},
		onResidualOrder: 5,
		onResidual(pokemon) {
			if (pokemon.hp <= pokemon.maxhp / 4) {
				pokemon.eatItem();
			}
		},
	},
	poisonbarb: {
		inherit: true,
		desc: "Holder's Poison-type attacks have 1.1x power.",
		onBasePower(basePower, user, target, move) {
			if (move.type === 'Poison') {
				return basePower * 1.1;
			}
		},
	},
	quickclaw: {
		inherit: true,
		onFractionalPriority(priority, pokemon) {
			if (this.randomChance(1, 5)) {
				return Math.round(priority) + 0.1;
			}
		},
	},
	salacberry: {
		inherit: true,
		onUpdate() {},
		onResidualOrder: 5,
		onResidual(pokemon) {
			if (pokemon.hp <= pokemon.maxhp / 4) {
				pokemon.eatItem();
			}
		},
	},
	seaincense: {
		inherit: true,
		desc: "Holder's Water-type attacks have 1.05x power.",
		onBasePower(basePower, user, target, move) {
			if (move && move.type === 'Water') {
				return basePower * 1.05;
			}
		},
	},
	sharpbeak: {
		inherit: true,
		desc: "Holder's Flying-type attacks have 1.1x power.",
		onBasePower(basePower, user, target, move) {
			if (move && move.type === 'Flying') {
				return basePower * 1.1;
			}
		},
	},
	silkscarf: {
		inherit: true,
		desc: "Holder's Normal-type attacks have 1.1x power.",
		onBasePower(basePower, user, target, move) {
			if (move.type === 'Normal') {
				return basePower * 1.1;
			}
		},
	},
	silverpowder: {
		inherit: true,
		desc: "Holder's Bug-type attacks have 1.1x power.",
		onBasePower(basePower, user, target, move) {
			if (move.type === 'Bug') {
				return basePower * 1.1;
			}
		},
	},
	sitrusberry: {
		inherit: true,
		desc: "Restores 30 HP when at 1/2 max HP or less. Single use.",
		onUpdate() {},
		onResidualOrder: 5,
		onResidual(pokemon) {
			if (pokemon.hp <= pokemon.maxhp / 2) {
				pokemon.eatItem();
			}
		},
		onEat(pokemon) {
			this.heal(30);
		},
	},
	softsand: {
		inherit: true,
		desc: "Holder's Ground-type attacks have 1.1x power.",
		onBasePower(basePower, user, target, move) {
			if (move.type === 'Ground') {
				return basePower * 1.1;
			}
		},
	},
	spelltag: {
		inherit: true,
		desc: "Holder's Ghost-type attacks have 1.1x power.",
		onBasePower(basePower, user, target, move) {
			if (move.type === 'Ghost') {
				return basePower * 1.1;
			}
		},
	},
	starfberry: {
		inherit: true,
		onUpdate() {},
		onResidualOrder: 5,
		onResidual(pokemon) {
			if (pokemon.hp <= pokemon.maxhp / 4) {
				pokemon.eatItem();
			}
		},
	},
	twistedspoon: {
		inherit: true,
		desc: "Holder's Psychic-type attacks have 1.1x power.",
		onBasePower(basePower, user, target, move) {
			if (move.type === 'Psychic') {
				return basePower * 1.1;
			}
		},
	},
	wikiberry: {
		inherit: true,
		onUpdate() {},
		onResidualOrder: 5,
		onResidual(pokemon) {
			if (pokemon.hp <= pokemon.maxhp / 2) {
				pokemon.eatItem();
			}
		},
	},
	bugmemory: {
		inherit: true,
		gen: 3,
	},
	darkmemory: {
		inherit: true,
		gen: 3,
	},
	dragonmemory: {
		inherit: true,
		gen: 3,
	},
	electricmemory: {
		inherit: true,
		gen: 3,
	},
	fightingmemory: {
		inherit: true,
		gen: 3,
	},
	firememory: {
		inherit: true,
		gen: 3,
	},
	flyingmemory: {
		inherit: true,
		gen: 3,
	},
	ghostmemory: {
		inherit: true,
		gen: 3,
	},
	grassmemory: {
		inherit: true,
		gen: 3,
	},
	groundmemory: {
		inherit: true,
		gen: 3,
	},
	icememory: {
		inherit: true,
		gen: 3,
	},
	poisonmemory: {
		inherit: true,
		gen: 3,
	},
	psychicmemory: {
		inherit: true,
		gen: 3,
	},
	rockmemory: {
		inherit: true,
		gen: 3,
	},
	steelmemory: {
		inherit: true,
		gen: 3,
	},
	watermemory: {
		inherit: true,
		gen: 3,
	},
	expertbelt: {
		name: "Expert Belt",
		spritenum: 132,
		fling: {
			basePower: 10,
		},
		onModifyDamage(damage, source, target, move) {
			if (move && target.getMoveHitData(move).typeMod > 0) {
				return this.chainModify([0x1333, 0x1000]);
			}
		},
		num: 268,
		gen: 3,
	},
	thickclub: {
		name: "Thick Club",
		spritenum: 491,
		fling: {
			basePower: 90,
		},
		onModifyAtkPriority: 1,
		onModifyAtk(atk, pokemon) {
			if (pokemon.baseSpecies.baseSpecies === 'Cubone' || pokemon.baseSpecies.baseSpecies === 'Marowak') {
				return this.chainModify(2);
			}
		},
		itemUser: ["Marowak", "Cubone", "Marowak-Alola"],
		num: 258,
		gen: 2,
	},
	stick: {
		name: "Stick",
		fling: {
			basePower: 60,
		},
		spritenum: 475,
		onModifyCritRatio(critRatio, user) {
			if (["farfetchd", "sirfetchd"].includes(this.toID(user.baseSpecies.baseSpecies))) {
				return critRatio + 2;
			}
		},
		itemUser: ["Farfetch\u2019d", "Farfetch\u2019d-Galar", "Sirfetch\u2019d"],
		num: 259,
		gen: 2,
	},
	occaberry: {
		inherit: true,
		gen: 3,
	},
	passhoberry: {
		inherit: true,
		gen: 3,
	},
	wacanberry: {
		inherit: true,
		gen: 3,
	},
	rindoberry: {
		inherit: true,
		gen: 3,
	},
	yacheberry: {
		inherit: true,
		gen: 3,
	},
	chopleberry: {
		inherit: true,
		gen: 3,
	},
	kebiaberry: {
		inherit: true,
		gen: 3,
	},
	shucaberry: {
		inherit: true,
		gen: 3,
	},
	cobaberry: {
		inherit: true,
		gen: 3,
	},
	payapaberry: {
		inherit: true,
		gen: 3,
	},
	tangaberry: {
		inherit: true,
		gen: 3,
	},
	chartiberry: {
		inherit: true,
		gen: 3,
	},
	kasibberry: {
		inherit: true,
		gen: 3,
	},
	habanberry: {
		inherit: true,
		gen: 3,
	},
	colburberry: {
		inherit: true,
		gen: 3,
	},
	babiriberry: {
		inherit: true,
		gen: 3,
	},
	chilanberry: {
		inherit: true,
		gen: 3,
	},
	custapberry: {
		inherit: true,
		gen: 3,
	},
	airballoon: {
		inherit: true,
		gen: 3,
	},
	
	
	assaultvest: {
		inherit: true,
		isViable: false,
	},
	choicescarf: {
		inherit: true,
		isViable: false,
	},
	choicespecs: {
		inherit: true,
		isViable: false,
	},
	eviolite: {
		inherit: true,
		isViable: false,
	},
	focussash: {
		inherit: true,
		isViable: false,
	},
	heavydutyboots: {
		inherit: true,
		isViable: false,
	},
	lifeorb: {
		inherit: true,
		isViable: false,
	},
	rockyhelmet: {
		inherit: true,
		isViable: false,
	},
};
