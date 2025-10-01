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

    function CastCreation(fluid, model, cast) {
        event.custom({
            "type": "tconstruct:casting_table",
            "cast": {
                "item": model
            },
            "cast_consumed": true,
            "cooling_time": 60,
            "fluid": {
                "amount": 90,
                "fluid": fluid
            },
            "result": cast,
            "switch_slots": true
        })
    }
    function RuneCasting(fluid, rune, cast, fluid_amount) {
        event.custom({
            "type": "tconstruct:casting_table",
            "cast": {
                "item": cast
            },
            "cooling_time": 40,
            "fluid": {
                "amount": fluid_amount,
                "fluid": fluid
            },
            "result": {
                "item": rune
            }
        })
    }
    function RunePack(rune, cast, rune_amount){
        CastCreation('kubejs:liquid_transmuted_silver', rune, cast);
        RuneCasting('kubejs:liquid_vinteum', rune, cast, rune_amount);
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


    //符文铸造系列
    //嬗变银液体定义与处理
    tconstruct.melting(Fluid.of('kubejs:liquid_transmuted_silver', 90), 'mna:transmuted_silver').temperature(500).time(40);
    tconstruct.melting(Fluid.of('kubejs:liquid_transmuted_silver', 90), '#tconstruct:casts/runes').temperature(500).time(40);
    FluidtoIngot('kubejs:liquid_transmuted_silver', 'mna:transmuted_silver');
    event.custom({
        "type": "tconstruct:casting_basin",
        "cooling_time": 180,
        "fluid": {
            "amount": 810,
            "fluid": 'kubejs:liquid_transmuted_silver'
        },
        "result": {
            "item": 'mna:decoration/transmuted_silver_block'
        }
    })

    //符文铸造
    RunePack('mna:rune_ritual_metal', 'kubejs:ritual_rune_cast', 18);

})