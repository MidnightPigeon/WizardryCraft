//神秘遗物相关修改在这里编写
ServerEvents.recipes(event => {
    
    //无主护身符
    event.shaped(Item.of('enigmaticlegacy:unwitnessed_amulet',1),
        ['ABA',
        'BCB',
        'ABA'],
        {
            A:'mna:decoration/transmuted_silver_block',
            B:'mna:purified_vinteum_ingot',
            C:'enigmaticlegacy:insignia'
        }
    )

    //飞升护符（七合一）
    event.shaped(Item.of('enigmaticlegacy:ascension_amulet',1),
        ['AAA',
        'AHA',
        'AIA'],
        {
            A:'enigmaticlegacy:unwitnessed_amulet',
            H:'minecraft:netherite_ingot',
            I:'enigmaticlegacy:astral_block'
        }
    )

})