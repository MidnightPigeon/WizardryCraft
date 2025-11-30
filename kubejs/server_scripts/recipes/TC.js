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
    //创建模具
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
    //基于模具的铸造
    function TableCasting(fluid, result, cast, fluid_amount) {
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
                "item": result
            }
        })
    }
    //符文铸造包
    function RunePack(rune, cast, rune_amount){
        CastCreation('kubejs:liquid_transmuted_silver', rune, cast);
        TableCasting('kubejs:liquid_vinteum', rune, cast, rune_amount);
    }
    //构装体部件铸造包
    function ConstructPack(part, cast){
        CastCreation('kubejs:liquid_transmuted_silver', part, cast);
        TableCasting('kubejs:liquid_purified_vinteum', part, cast, 90);
    }

    //墓园：暗铁
    tconstruct.melting(Fluid.of('kubejs:liquid_dark_iron', 90), 'graveyard:dark_iron_ingot').temperature(800).time(60);
        tconstruct.melting(Fluid.of('kubejs:liquid_dark_iron', 810), 'graveyard:dark_iron_block').temperature(800).time(540);
    FluidtoIngot('kubejs:liquid_dark_iron', 'graveyard:dark_iron_ingot');
    event.custom({
        "type": "tconstruct:casting_basin",
        "cooling_time": 200,
        "fluid": {
            "amount": 810,
            "fluid": 'kubejs:liquid_dark_iron'
        },
        "result": {
            "item": 'graveyard:dark_iron_block'
        }
    })

    //移除匠魂铁锭配方并补回
    event.remove({id:'tconstruct:smeltery/melting/metal/iron/ingot'});
    tconstruct.melting(Fluid.of('tconstruct:molten_iron', 90), 'minecraft:iron_ingot').temperature(800).time(300);


    //更好的末地（补全）：末影碎片，末影矿石，末影块
    tconstruct.melting(Fluid.of('tconstruct:molten_ender', 50), 'betterend:ender_shard').temperature(477).time(60);
    tconstruct.melting(Fluid.of('tconstruct:molten_ender', 250), 'betterend:ender_ore').temperature(477).time(180);
        tconstruct.melting(Fluid.of('tconstruct:molten_ender', 1000), 'betterend:ender_block').temperature(477).time(360);
    //更好的末地：末影铁，太古合金，终末合金
    //末影铁，粗末影铁，末影铁矿石
    tconstruct.melting(Fluid.of('kubejs:liquid_thallasium', 90), 'betterend:thallasium_ingot').temperature(750).time(60);
    tconstruct.melting(Fluid.of('kubejs:liquid_thallasium', 180), 'betterend:thallasium_raw').temperature(750).time(60);
    tconstruct.melting(Fluid.of('kubejs:liquid_thallasium', 270), 'betterend:thallasium_ore').temperature(750).time(120);
        tconstruct.melting(Fluid.of('kubejs:liquid_thallasium', 810), 'betterend:thallasium_block').temperature(750).time(360);
    FluidtoIngot('kubejs:liquid_thallasium', 'betterend:thallasium_ingot');
    event.custom({
        "type": "tconstruct:casting_basin",
        "cooling_time": 200,
        "fluid": {
            "amount": 810,
            "fluid": 'kubejs:liquid_thallasium'
        },
        "result": {
            "item": 'betterend:thallasium_block'
        }
    })
    //太古合金
    tconstruct.melting(Fluid.of('kubejs:liquid_aeternium', 90), 'betterend:aeternium_ingot').temperature(1000).time(80);
        tconstruct.melting(Fluid.of('kubejs:liquid_aeternium', 810), 'betterend:aeternium_block').temperature(1000).time(480);
    FluidtoIngot('kubejs:liquid_aeternium', 'betterend:aeternium_ingot');
    event.custom({
        "type": "tconstruct:casting_basin",
        "cooling_time": 200,
        "fluid": {
            "amount": 810,
            "fluid": 'kubejs:liquid_aeternium'
        },
        "result": {
            "item": 'betterend:aeternium_block'
        }
    })
    //终末合金
    tconstruct.melting(Fluid.of('kubejs:liquid_terminite', 90), 'betterend:terminite_ingot').temperature(1250).time(100);
        tconstruct.melting(Fluid.of('kubejs:liquid_terminite', 810), 'betterend:terminite_block').temperature(1250).time(600);
    FluidtoIngot('kubejs:liquid_terminite', 'betterend:terminite_ingot');
    event.custom({
        "type": "tconstruct:casting_basin",
        "cooling_time": 200,
        "fluid": {
            "amount": 810,
            "fluid": 'kubejs:liquid_terminite'
        },
        "result": {
            "item": 'betterend:terminite_block'
        }
    })

    //更好的下界：辛辛那金
    tconstruct.melting(Fluid.of('kubejs:liquid_cincinnasite', 90), 'betternether:cincinnasite_ingot').temperature(700).time(60);
    tconstruct.melting(Fluid.of('kubejs:liquid_cincinnasite', 90), 'betternether:cincinnasite').temperature(700).time(60);
        tconstruct.melting(Fluid.of('kubejs:liquid_cincinnasite', 360), 'betternether:cincinnasite_forged').temperature(700).time(200);
        tconstruct.melting(Fluid.of('kubejs:liquid_cincinnasite', 360), 'betternether:cincinnasite_block').temperature(700).time(200);
    FluidtoIngot('kubejs:liquid_cincinnasite', 'betternether:cincinnasite_ingot');
    event.custom({
        "type": "tconstruct:casting_basin",
        "cooling_time": 160,
        "fluid": {
            "amount": 360,
            "fluid": 'kubejs:liquid_cincinnasite'
        },
        "result": {
            "item": 'betternether:cincinnasite_forged'
        }
    })

    //温特姆系列
    tconstruct.melting(Fluid.of('kubejs:liquid_vinteum', 90), 'mna:vinteum_ingot').temperature(500).time(50);
        tconstruct.melting(Fluid.of('kubejs:liquid_vinteum', 810), 'mna:vinteum_block').temperature(500).time(450);
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
    tconstruct.melting(Fluid.of('kubejs:liquid_superheated_vinteum', 90), 'mna:superheated_vinteum_ingot').temperature(750).time(40);
    FluidtoIngot('kubejs:liquid_superheated_vinteum', 'mna:superheated_vinteum_ingot');
    tconstruct.melting(Fluid.of('kubejs:liquid_superheated_purified_vinteum', 90), 'mna:superheated_purified_vinteum_ingot').temperature(1500).time(80);
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
    RunePack('mna:rune_marking', 'kubejs:marking_rune_cast', 90);
    RunePack('mna:rune_defense', 'kubejs:defense_rune_cast', 90);
    RunePack('mna:rune_aura', 'kubejs:aura_rune_cast', 90);
    RunePack('mna:rune_projection', 'kubejs:projection_rune_cast', 90);
    RunePack('mna:rune_earth', 'kubejs:earth_rune_cast', 90);
    RunePack('mna:rune_water', 'kubejs:water_rune_cast', 90);
    RunePack('mna:rune_fire', 'kubejs:fire_rune_cast', 90);
    RunePack('mna:rune_air', 'kubejs:air_rune_cast', 90);
    RunePack('mna:rune_ender', 'kubejs:ender_rune_cast', 90);
    RunePack('mna:rune_arcane', 'kubejs:arcane_rune_cast', 90);

    //构装体部件铸造
    ConstructPack('mna:constructs/rune_rod', 'kubejs:rod_frame_cast');
    ConstructPack('mna:constructs/rune_torso', 'kubejs:torso_frame_cast');
    ConstructPack('mna:constructs/rune_head', 'kubejs:head_frame_cast');
    ConstructPack('mna:constructs/rune_hips', 'kubejs:hips_frame_cast');
    ConstructPack('mna:constructs/rune_hammer', 'kubejs:hammer_frame_cast');
    ConstructPack('mna:constructs/rune_claw', 'kubejs:claw_frame_cast');
    ConstructPack('mna:constructs/rune_axe', 'kubejs:axe_frame_cast');


})