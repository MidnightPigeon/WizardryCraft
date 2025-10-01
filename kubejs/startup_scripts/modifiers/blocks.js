BlockEvents.modification(event => {
    
    function LightDefine(blockname, lightlevel) {
        event.modify(blockname, block => {
            block.lightEmission = lightlevel
        })
    }

    //定义温特姆流体光照
    LightDefine('kubejs:liquid_vinteum', 5)
    LightDefine('kubejs:liquid_transmuted_silver', 5)
    LightDefine('kubejs:liquid_superheated_vinteum', 10)
    LightDefine('kubejs:liquid_purified_vinteum', 10)
    LightDefine('kubejs:liquid_superheated_purified_vinteum', 15)

})