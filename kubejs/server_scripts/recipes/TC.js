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
    //铸造符文（其实铸造别的也行）
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



    //温特姆系列
    tconstruct.melting(Fluid.of('kubejs:liquid_vinteum', 90), 'mna:vinteum_ingot').temperature(500).time(50);
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