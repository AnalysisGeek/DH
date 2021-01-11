"use strict";Object.defineProperty(exports, "__esModule", {value: true}); const Items = {
	mossysandwich: {
		name: "Mossy Sandwich",
		spritenum: 578,
		megaStone: "Toxtricity-Mega-Mossy",
		megaEvolves: "Toxtricity",
		itemUser: ["Toxtricity"],
		onTakeItem(item, source) {
			if (item.megaEvolves === source.baseSpecies.baseSpecies) return false;
			return true;
		},
		num: -5000,
		gen: 8,
		desc: "Mossy Sandwich's stone for the submission sandbox.",
	},
	ausma: {
		name: "Ausma",
		spritenum: 578,
		megaStone: "Exploud-Mega-Ausma",
		megaEvolves: "Exploud",
		itemUser: ["Exploud"],
		onTakeItem(item, source) {
			if (item.megaEvolves === source.baseSpecies.baseSpecies) return false;
			return true;
		},
		num: -5000,
		gen: 8,
		desc: "Ausma's stone for the submission sandbox.",
	},
	bitbitio: {
		name: "BitBitio",
		spritenum: 578,
		megaStone: "Toxtricity-Mega-BitBitio",
		megaEvolves: "Toxtricity",
		itemUser: ["Toxtricity"],
		onTakeItem(item, source) {
			if (item.megaEvolves === source.baseSpecies.baseSpecies) return false;
			return true;
		},
		num: -5000,
		gen: 8,
		desc: "BitBitio's stone for the submission sandbox.",
	},
}; exports.Items = Items;
