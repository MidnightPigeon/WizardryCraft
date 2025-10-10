//匠魂材料注册辅助配方写在这里
ServerEvents.recipes(event => {

    //嬗变银
    event.custom({
        "type": "tconstruct:material",
        "ingredient": {
            "item": "mna:transmuted_silver"
        },
        "material": "kubejs:transmuted_silver",
        "needed": 1,
        "value": 1
    })


})