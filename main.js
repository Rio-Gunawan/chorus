let isPlaying = false;

$(function () {

    $("#play_and_pause").on("click", function () {
        isPlaying = !isPlaying;
        $("#play").toggle();
        $("#pause").toggle();
    }
    );
});

// プログレスバーのデザイン
const activeColor = "#2d3985";
const inactiveColor = "#dddddd";

$(".inputRange").on("input", function () {
    const ratio = (this.value - this.min) / (this.max - this.min) * 100;
    $(this).css("background", `linear-gradient(90deg, ${activeColor} ${ratio}%, ${inactiveColor} ${ratio}%)`);
});