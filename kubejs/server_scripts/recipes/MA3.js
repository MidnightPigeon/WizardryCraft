//MA3相关修改在这里编写
ServerEvents.recipes(event => {
    
    //替换温特姆符法魔杖顶端
    event.replaceInput({mod:'mna',output:'mna:manaweaver_wand'},
        'mna:vinteum_dust' , 'mna:transmuted_silver')


})