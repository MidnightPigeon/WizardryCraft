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
