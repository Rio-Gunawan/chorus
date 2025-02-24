// プログレスバーのデザイン
const activeColor = "#2d3985";
const inactiveColor = "#dddddd";

let isPlaying = false;
let isRepeat = false;

$(function () {
    const audio = $("#audio")[0];
    const progressbar = $("#progress_bar");
    const currentTime = $("#current_time");
    const durationTime = $("#duration_time");

    // 音楽ファイルが読み込まれた時の動作
    audio.addEventListener("loadedmetadata", function () {
        const duration = audio.duration;
        durationTime.text(convertTimeFormat(duration));
    });

    // 再生ボタンがクリックされた時の動作
    $("#play_and_pause").on("click", function () {
        isPlaying = !isPlaying;
        // ボタンの表示を切り替える
        $("#play").toggle();
        $("#pause").toggle();

        // isPlayingがtrueの時、音楽を再生する
        if (isPlaying) {
            audio.play();
        } else {
            audio.pause();
        }
    });

    // 再生中の場合に、プログレスバーを動かす
    audio.addEventListener("timeupdate", function () {
        const current = audio.currentTime;
        const duration = audio.duration;
        const progress = (current / duration) * 100;
        progressbar.val(progress);
        setRangeStyle(progressbar[0]);
        currentTime.text(convertTimeFormat(current));
    });

    // 再生終了時の動作
    audio.addEventListener("ended", function () {
        if (isRepeat) {
            audio.currentTime = 0;
            audio.play();
        } else {
            isPlaying = false;
            $("#play").show();
            $("#pause").hide();
        }
    });

    // プログレスバーがクリックされた時の動作
    $(".inputRange").on("input", function () {
        setRangeStyle(this);
        audio.currentTime = audio.duration * (this.value / 100);
    });

    // 前へボタンがクリックされた時の動作
    $("#prev").on("click", function () {
        audio.currentTime = 0;
    });

    // リピートボタンがクリックされた時の動作
    $("#repeat").on("click", function () {
        isRepeat = !isRepeat;
        $(this).toggleClass("active");
    });
});

function setRangeStyle(obj) {
    const ratio = (obj.value - obj.min) / (obj.max - obj.min) * 100;
    $(obj).css("background", `linear-gradient(90deg, ${activeColor} ${ratio}%, ${inactiveColor} ${ratio}%)`);
}

function convertTimeFormat(time) {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}