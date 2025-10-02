// 注册脚本

StartupEvents.registry('block', (event) => {
    //注册方块写在这里

})

StartupEvents.registry('item', (event) => {
    //注册物品写在这里

	//匠魂-MNA系列模板
	//仪式符文
	event.create('ritual_rune_cast')
		.displayName('Ritual Rune Cast')
		.tag('tconstruct:casts/runes')
		.texture('kubejs:item/ritual_rune_cast')
	//防御符文
	event.create('defense_rune_cast')
		.displayName('Defense Rune Cast')
		.tag('tconstruct:casts/runes')
		.texture('kubejs:item/defense_rune_cast')
	//光环符文
	event.create('aura_rune_cast')
		.displayName('Aura Rune Cast')
		.tag('tconstruct:casts/runes')
		.texture('kubejs:item/aura_rune_cast')
	//摄魔符文
	event.create('projection_rune_cast')
		.displayName('Projection Rune Cast')
		.tag('tconstruct:casts/runes')
		.texture('kubejs:item/projection_rune_cast')
	//标记符文
	event.create('marking_rune_cast')
		.displayName('Marking Rune Cast')
		.tag('tconstruct:casts/runes')
		.texture('kubejs:item/marking_rune_cast')
	//地水火风符文
	event.create('earth_rune_cast')
		.displayName('Earth Rune Cast')
		.tag('tconstruct:casts/runes')
		.texture('kubejs:item/earth_rune_cast')
	event.create('water_rune_cast')
		.displayName('Water Rune Cast')
		.tag('tconstruct:casts/runes')
		.texture('kubejs:item/water_rune_cast')
	event.create('fire_rune_cast')
		.displayName('Fire Rune Cast')
		.tag('tconstruct:casts/runes')
		.texture('kubejs:item/fire_rune_cast')
	event.create('air_rune_cast')
		.displayName('Air Rune Cast')
		.tag('tconstruct:casts/runes')
		.texture('kubejs:item/air_rune_cast')
	//末影符文
	event.create('ender_rune_cast')
		.displayName('Ender Rune Cast')
		.tag('tconstruct:casts/runes')
		.texture('kubejs:item/ender_rune_cast')
	//奥术符文
	event.create('arcane_rune_cast')
		.displayName('Arcane Rune Cast')
		.tag('tconstruct:casts/runes')
		.texture('kubejs:item/arcane_rune_cast')


	//构装体架构：杆
	event.create('rod_frame_cast')
		.displayName('Rod Frame Cast')
		.tag('tconstruct:casts/runes')
		.texture('kubejs:item/rod_cast')
	//构装体架构：躯干
	event.create('torso_frame_cast')
		.displayName('Torso Frame Cast')
		.tag('tconstruct:casts/runes')
		.texture('kubejs:item/torso_cast')
	//构装体架构：头
	event.create('head_frame_cast')
		.displayName('Head Frame Cast')
		.tag('tconstruct:casts/runes')
		.texture('kubejs:item/head_cast')
	//构装体架构：下半身
	event.create('hips_frame_cast')
		.displayName('Hips Frame Cast')
		.tag('tconstruct:casts/runes')
		.texture('kubejs:item/hips_cast')
	//构装体架构：抓手
	event.create('claw_frame_cast')
		.displayName('Claw Frame Cast')
		.tag('tconstruct:casts/runes')
		.texture('kubejs:item/claw_cast')
	//构装体架构：锤
	event.create('hammer_frame_cast')
		.displayName('Hammer Frame Cast')
		.tag('tconstruct:casts/runes')
		.texture('kubejs:item/hammer_cast')
	//构装体架构：斧
	event.create('axe_frame_cast')
		.displayName('Axe Frame Cast')
		.tag('tconstruct:casts/runes')
		.texture('kubejs:item/axe_cast')

		
})

StartupEvents.registry('fluid', (event) => {
    //注册流体写在这里

	//温特姆
    event.create('liquid_vinteum')
		.thinTexture(0x87CEEB)
		.bucketColor(0x87CEEB)
		.displayName('Liquid Vinteum')
		.createAttributes().dropOff(2).tickDelay(40)
    //超热温特姆
    event.create('liquid_superheated_vinteum')
		.thinTexture(0xFFC0CB)
		.bucketColor(0xFFC0CB)
		.displayName('Liquid Superheated Vinteum')
		.createAttributes().dropOff(2).tickDelay(40)
	//纯净温特姆
	event.create('liquid_purified_vinteum')
		.thinTexture(0xA96FCE)
		.bucketColor(0xA96FCE)
		.displayName('Liquid Purified Vinteum')
		.createAttributes().dropOff(2).tickDelay(40)
	//超热纯净温特姆
	event.create('liquid_superheated_purified_vinteum')
		.thinTexture(0xE9B3F8)
		.bucketColor(0xE9B3F8)
		.displayName('Liquid Superheated Purified Vinteum')
		.createAttributes().dropOff(2).tickDelay(40)
	//嬗变银
	event.create('liquid_transmuted_silver')
		.thinTexture(0xC0C0C0)
		.bucketColor(0xC0C0C0)
		.displayName('Liquid Transmuted Silver')
		.createAttributes().dropOff(2).tickDelay(40)
})
