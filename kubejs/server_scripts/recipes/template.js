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
//多次使用
event.custom({
    "type": "tconstruct:casting_table",
    "cast": {
        "tag": "tconstruct:casts/multi_use/ingot"
    },
    "cooling_time": 60,
    "fluid": {
        "amount": 90,
        "fluid": "液体"
    },
    "result": {
        "item": "物品"
    }
}
//单次使用
event.custom({
    "type": "tconstruct:casting_table",
    "cast": {
        "tag": "tconstruct:casts/single_use/ingot"
    },
    "cast_consumed": true,
    "cooling_time": 60,
    "fluid": {
        "amount": 90,
        "fluid": "液体"
    },
    "result": {
        "item": "物品"
    }
}
//方块
event.custom({
    "type": "tconstruct:casting_basin",
    "cooling_time": 180,
    "fluid": {
        "amount": 810,
        "fluid": "液体"
    },
    "result": {
        "item": "方块"
  }
})

*/