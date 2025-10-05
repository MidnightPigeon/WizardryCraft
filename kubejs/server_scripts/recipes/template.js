//模板文件放在这里
/*
加入有序配方模板
event.shaped(Item.of('名字',数量),
    ['***',
    '***',
    '***'],
    {
        *:'',
        *:'',
        *:''
    }
)
*/
/*
加入无序配方模板
event.shapeless(Item.of('名字',数量),
    [
        '材料1',
        '材料2',
        '材料3'
    ]
)
*/
/*
替换配方系列
event.replaceInput({mod:'模组名',output:'输出产物'},
    '要被替换的物品名' , '要替换成的物品名')
*/
/*
删除配方：
event.remove({id:'配方ID'})
*/

//匠魂相关模板
/*

//熔铸产出部分
//铸模配方
    event.custom({
        "type": "tconstruct:casting_table",
        "cast": {
            "item": 基底材料（一般是铸模）（cast可以不写）
        },
        "cast_consumed": true,//是否消耗材料（默认不消耗，可以不写这行）
        "cooling_time": 冷却时间4=1s,
        "fluid": {
            "amount": 流体量mb,
            "fluid": 流体种类
        },
        "result": 产出物品,
    })
//铸造盆配方
    event.custom({
        "type": "tconstruct:casting_basin",
        "cast": {
            "item": 基底材料（cast可以不写）
        },
        "cast_consumed": true,//是否消耗材料（默认不消耗，可以不写这行）
        "cooling_time": 冷却时间4=1s,
        "fluid": {
            "amount": 液体mb,
            "fluid": "液体"
        },
        "result": {
            "item": "产物"
        }
    })

*/