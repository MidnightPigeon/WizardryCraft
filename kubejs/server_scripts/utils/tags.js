//物品标签追加
ServerEvents.tags("item", (event) => {
    
    //工匠砧方块：辛辛那金，末影铁，太古合金，终末合金，温特姆
    event.add("tconstruct:anvil_metal",'betternether:cincinnasite_forged')
    event.add("tconstruct:anvil_metal",'betterend:thallasium_block')
    event.add("tconstruct:anvil_metal",'betterend:aeternium_block')
    event.add("tconstruct:anvil_metal",'betterend:terminite_block')
    event.add("tconstruct:anvil_metal",'mna:vinteum_block')

})

//方块标签添加
ServerEvents.tags("block", (event) => {
    
    //工匠砧方块：辛辛那金，末影铁，太古合金，终末合金，温特姆
    event.add("tconstruct:anvil_metal",'betternether:cincinnasite_forged')
    event.add("tconstruct:anvil_metal",'betterend:thallasium_block')
    event.add("tconstruct:anvil_metal",'betterend:aeternium_block')
    event.add("tconstruct:anvil_metal",'betterend:terminite_block')
    event.add("tconstruct:anvil_metal",'mna:vinteum_block')

})

//液体标签添加
ServerEvents.tags("fluid", (event) => {
    
})