//MA3相关修改在这里编写
ServerEvents.recipes(event => {
    
    //替换温特姆符法魔杖顶端
    event.replaceInput({mod:'mna',output:'mna:manaweaver_wand'},
        'mna:vinteum_dust' , 'mna:transmuted_silver')
    
    //高山流水之瓮灌注404桶熔岩产生熔火地核之瓮
    event.custom({
        "type": "tconstruct:casting_table",
        "cast": {
            "item": 'mna:fluid_jug_infinite_water'
        },
        "cast_consumed": true,
        "cooling_time": 20,
        "fluid": {
            "amount": 404000,
            "fluid": 'minecraft:lava'
        },
        "result": 'mna:fluid_jug_infinite_lava',
    })


})