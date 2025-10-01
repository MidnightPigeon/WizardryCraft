//匠魂相关修改写在这里
ServerEvents.recipes(event => {
    const { tconstruct } = event.recipes;

    //定义金属处理函数
    function FluidtoIngot(fluid, metal) {
        event.custom({
            "type": "tconstruct:casting_table",
            "cast": {
                "tag": "tconstruct:casts/multi_use/ingot"
            },
            "cooling_time": 60,
            "fluid": {
                "amount": 90,
                "fluid": fluid
            },
            "result": {
                "item": metal
            }
        })
        event.custom({
            "type": "tconstruct:casting_table",
            "cast": {
                "tag": "tconstruct:casts/single_use/ingot"
            },
            "cooling_time": 60,
            "fluid": {
                "amount": 90,
                "fluid": fluid
            },
            "result": {
                "item": metal
            }
        })
    }

    //温特姆系列
    tconstruct.melting(Fluid.of('kubejs:liquid_vinteum', 90), 'mna:vinteum_ingot').temperature(500).time(40);
    FluidtoIngot('kubejs:liquid_vinteum', 'mna:vinteum_ingot');
    event.custom({
        "type": "tconstruct:casting_basin",
        "cooling_time": 180,
        "fluid": {
            "amount": 810,
            "fluid": 'kubejs:liquid_vinteum'
        },
        "result": {
            "item": 'mna:vinteum_block'
        }
    })
    tconstruct.melting(Fluid.of('kubejs:liquid_purified_vinteum', 90), 'mna:purified_vinteum_ingot').temperature(1200).time(100);
    FluidtoIngot('kubejs:liquid_purified_vinteum', 'mna:purified_vinteum_ingot');
    FluidtoIngot('kubejs:liquid_superheated_vinteum', 'mna:superheated_vinteum_ingot');
    FluidtoIngot('kubejs:liquid_superheated_purified_vinteum', 'mna:superheated_purified_vinteum_ingot');

    tconstruct.alloy(Fluid.of('kubejs:liquid_superheated_vinteum', 180), [Fluid.of('kubejs:liquid_vinteum', 90), Fluid.lava(90)]).temperature(750);
    tconstruct.alloy(Fluid.of('kubejs:liquid_superheated_purified_vinteum', 180), [Fluid.of('kubejs:liquid_purified_vinteum', 90), Fluid.lava(90)]).temperature(1500);


})