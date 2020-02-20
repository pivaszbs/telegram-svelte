<script>
    import emojiFlags from 'emoji-flags';
    export let name;
    export let alpha;
    export let code;
</script>

<style lang="scss">
li {
    display: flex;
    justify-content: space-between;
    cursor: pointer;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    background: var(--white);

    height: 50px;
    min-height: 50px;
    width: 360px;
    padding-left: 15px;
    padding-right: 15px;
    vertical-align: middle;

    &:hover {
        background: var(--light-gray);
    }


    .hide {
        display: none
    }
}
span {
    display: inline-block;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
</style>

<li>
    <span class='popup-item__flag'>{emojiFlags[alpha] ? emojiFlags[alpha].emoji : 'NONE'}</span>
    <span class='popup-item__name'>{name}</span>
    <span class='popup-item__code'>{code}</span>
</li>