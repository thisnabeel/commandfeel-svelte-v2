
<script>
    import Category from "./Category.svelte";
    // import { selectedSkill, selectSkill, selected } from "$lib/stores/main";

    // $: console.log("fromr ooww", $selectedSkill.feel);
    let feels = [
        {
            title: "BaseFeel (Things)",
            col: "col-lg-12"
        },
        {
            title: "MathFeel (Physics)",
            col: "col-lg-4"
        },
        {
            title: "MorphFeel (Reactions)",
            col: "col-lg-4"
        },
        {
            title: "PulseFeel (ElectroMagnetism)",
            col: "col-lg-4"
        },
        {
            title: "TraceFeel (Visual)",
            col: "col-lg-4"
        },
        {
            title: "HumFeel (Music)",
            col: "col-lg-4"
        },
        {
            title: "TasteFeel (Taste&Smell)",
            col: "col-lg-4"
        }
    ]
</script>


<div class="feels row">
    <!-- Category -->
    {#each feels as feel}
    <Category col={feel.col} title={feel.title} slug={feel.title.split(" ")[0]}></Category>
    {/each}

</div>
<style>

    .feels {
        text-align: center;
        margin-bottom: 15px;
    }

    .row {
        display: flex;
        flex-wrap: wrap;
        margin-right: -15px;
        margin-left: -15px;
    }

</style>