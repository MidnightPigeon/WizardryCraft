//神秘遗物相关修改在这里编写
ServerEvents.recipes(event => {
    
    //飞升护符（七合一）
    event.shaped(Item.of('enigmaticlegacy:ascension_amulet',1),
        ['AAA',
        'AHA',
        'AIA'],
        {
            A:'enigmaticlegacy:enigmatic_amulet',
            H:'minecraft:netherite_ingot',
            I:'enigmaticlegacy:astral_block'
        }
    )

})