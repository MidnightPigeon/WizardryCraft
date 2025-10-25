ItemEvents.modification(event => {
    event.modify('mna:bound_charm', item => {
        item.rarity = 'epic' // 这里设置稀有度
    })
})