// プログレスバーのデザイン
const activeColor = "#2d3985";
const inactiveColor = "#dddddd";

let isPlaying = false;
let isRepeat = false;
let isFirstPlayed = false;
let volumes = { "all": 1, "metronome": 1, "soprano": 1, "alto": 1, "tenor": 1, "bass": 1 };
let startTime = 0;
let sources = [];
let gainNodes = {};

// Web Audio API用のコンテキスト
let audioContext = null;

// 読み込む音声ソース用のオブジェクト（プロパティ名は再生時に使用）
const audioFiles = {
    metronome: "./audios/メトロノーム.mp3",
    soprano: "./audios/ソプラノ.mp3",
    alto: "./audios/アルト.mp3",
    tenor: "./audios/テノール.mp3",
    bass: "./audios/バス.mp3"
};

// 音声ソース読み込み後のバッファ格納用
let audioBuffers = {};

// 音声ソース読み込み関数
const getAudioBuffer = async (entries) => {
    const promises = [];    // 読み込み完了通知用
    const buffers = {};        // オーディオバッファ格納用

    entries.forEach((entry) => {
        const promise = new Promise((resolve) => {
            const [name, url] = entry;    // プロパティ名、ファイルのURLに分割

            // 音声ソース毎に非同期で読み込んでいく
            fetch(url)
                .then(response => response.blob())    // ファイル生データ
                .then(data => data.arrayBuffer())    // ArrayBufferとして取得
                .then(arrayBuffer => {
                    // ArrayBufferを音声データに戻してオブジェクト配列に格納する
                    audioContext.decodeAudioData(arrayBuffer, function (audioBuffer) {
                        buffers[name] = audioBuffer;
                        resolve();    // 読み込み完了通知をpromiseに送る
                    });
                });
        });
        promises.push(promise);        // 現在実行中のPromiseを格納しておく
    });
    await Promise.all(promises);    // 全ての音声ソース読み込みが完了してから
    return buffers;                    // オーディオバッファを返す
};

// 再生関数
const playSound = function () {
    // Safari用処理
    if (audioContext.state === "interrupted") {
        audioContext.resume().then(() => playSound());
        return;
    }
    if (isFirstPlayed) {
        if (audioContext.state === "suspended") {
            audioContext.resume();
        }
    } else {
        if (audioContext.state === "suspended") {
            audioContext.resume();
        }
        startTime = audioContext.currentTime;
        sources = Object.entries(audioBuffers).map(([name, buffer]) => {
            let source = audioContext.createBufferSource();    // 再生用のノードを作成
            let gainNode = audioContext.createGain();          // 個別のGainNodeを作成
            source.buffer = buffer;    // オーディオバッファをノードに設定
            source.connect(gainNode).connect(audioContext.destination);    // 出力先設定
            source.start();    // 再生
            source.onended = handleEnded; // 再生終了時の処理を設定
            gainNodes[name] = gainNode;   // GainNodeを保存
            return source;
        });
        isFirstPlayed = true;
    }
};

// 一時停止関数
const pauseSound = function () {
    audioContext.suspend();
};

// 再生位置の取得関数
const getCurrentTime = function () {
    if (audioContext.state === "running") {
        return audioContext.currentTime - startTime;
    } else {
        return 0;
    }
};

// 再生終了時の処理
const handleEnded = function () {
    if (getCurrentTime() < audioBuffers.metronome.duration) {
        return; // 再生が終わっていない場合は何もしない
    }
    if (isRepeat) {
        startTime = audioContext.currentTime;
        sources = Object.entries(audioBuffers).map(([name, buffer]) => {
            let source = audioContext.createBufferSource();    // 再生用のノードを作成
            let gainNode = audioContext.createGain();          // 個別のGainNodeを作成
            source.buffer = buffer;    // オーディオバッファをノードに設定
            source.connect(gainNode).connect(audioContext.destination);    // 出力先設定
            source.start();    // 再生
            source.onended = handleEnded; // 再生終了時の処理を設定
            gainNodes[name] = gainNode;   // GainNodeを保存
            return source;
        });
    } else {
        isPlaying = false;
        isFirstPlayed = false;
        $("#play").show();
        $("#pause").hide();
    }
};

$(async function () {
    // Web Audio API用音声コンテキスト生成
    audioContext = new AudioContext();

    // プロパティ毎にオブジェクトにして配列として取得
    const entries = Object.entries(audioFiles);

    // 音声ソースを読み込んで音声バッファに格納する
    audioBuffers = await getAudioBuffer(entries);

    // 再生ボタンのdisabledを解除
    $("#play_and_pause").prop("disabled", false);

    // ローディング画面を非表示にする
    const loading = document.querySelector(".loading");
    loading.classList.add("loaded");

    const progressbar = $("#progress_bar");
    const currentTime = $("#current_time");
    const durationTime = $("#duration_time");

    // 音楽ファイルが読み込まれた時に、再生時間を表示する
    const duration = audioBuffers.metronome.duration;
    durationTime.text(convertTimeFormat(duration));

    // 再生ボタンがクリックされた時の動作
    $("#play_and_pause").on("click", function () {
        isPlaying = !isPlaying;
        // ボタンの表示を切り替える
        $("#play").toggle();
        $("#pause").toggle();

        // isPlayingがtrueの時、音楽を再生する
        if (isPlaying) {
            playSound();
        } else {
            pauseSound();
        }
    });

    // 再生中の場合に、プログレスバーを動かす
    setInterval(() => {
        if (isPlaying) {
            const current = getCurrentTime();
            const duration = audioBuffers.metronome.duration;
            const progress = (current / duration) * 100;
            progressbar.val(progress);
            setRangeStyle(progressbar[0]);
            currentTime.text(convertTimeFormat(current));
        }
    }, 100);

    // プログレスバーがクリックされた時の動作
    $("#progress_bar").on("input", function () {
        setRangeStyle(this);
        const newTime = audioBuffers.metronome.duration * (this.value / 100);
        startTime = audioContext.currentTime - newTime;
        currentTime.text(convertTimeFormat(newTime));
        sources.forEach((source, index) => {
            source.stop();
            let newSource = audioContext.createBufferSource();
            newSource.buffer = source.buffer;
            newSource.connect(gainNodes[Object.keys(audioBuffers)[index]]).connect(audioContext.destination);
            newSource.start(0, newTime);
            newSource.onended = handleEnded; // 再生終了時の処理を設定
            sources[index] = newSource;
        });
    });

    // 前へボタンがクリックされた時の動作
    $("#prev").on("click", function () {
        sources.forEach((source, index) => {
            source.stop();
            startTime = audioContext.currentTime;
            let newSource = audioContext.createBufferSource();
            newSource.buffer = source.buffer;
            newSource.connect(gainNodes[Object.keys(audioBuffers)[index]]).connect(audioContext.destination);
            newSource.start();
            newSource.onended = handleEnded; // 再生終了時の処理を設定
            sources[index] = newSource;
        });
    });

    // リピートボタンがクリックされた時の動作
    $("#repeat").on("click", function () {
        isRepeat = !isRepeat;
        $(this).toggleClass("active");
    });

    // 音量が変更された時の処理
    $("#volume").on("input", function () {
        const volume = $(this).val();
        volumes["all"] = volume;
        Object.keys(gainNodes).forEach(gainNodeKey => {
            gainNodes[gainNodeKey].gain.value = volumes[gainNodeKey] * volume;
        });
    });

    $("#metronome").on("input", function () {
        const volume = $(this).val();
        volumes["metronome"] = volume;
        gainNodes.metronome.gain.value = volume * volumes["all"];
    });

    $("#soprano").on("input", function () {
        const volume = $(this).val();
        volumes["soprano"] = volume;
        gainNodes.soprano.gain.value = volume * volumes["all"];
    });

    $("#alto").on("input", function () {
        const volume = $(this).val();
        volumes["alto"] = volume;
        gainNodes.alto.gain.value = volume * volumes["all"];
    });

    $("#tenor").on("input", function () {
        const volume = $(this).val();
        volumes["tenor"] = volume;
        gainNodes.tenor.gain.value = volume * volumes["all"];
    });

    $("#bass").on("input", function () {
        const volume = $(this).val();
        volumes["bass"] = volume;
        gainNodes.bass.gain.value = volume * volumes["all"];
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

$(function () {
    $(".blank").css("height", $("#bottom_menu").height());
    Object.values($(".inputRange")).forEach((input) => {
        setRangeStyle(input);
    });
    $(".inputRange").on("input", function () {
        setRangeStyle(this);
    });

    // 音量のrangeとtextboxの連動
    $("#volume").on("input", function () {
        $("#whole_volume_text").val(Math.floor($(this).val() * 100));
        if ($(this).val() > 1.01) {
            $("#volume_is_too_high").show();
        } else {
            $("#volume_is_too_high").hide();
        }
    });
    $("#whole_volume_text").on("input", function () {
        $("#volume").val($(this).val() / 100);
        $("#volume").trigger("input");
    });
    $("#metronome").on("input", function () {
        $("#metronome_volume_text").val(Math.floor($(this).val() * 100));
    });
    $("#metronome_volume_text").on("input", function () {
        $("#metronome").val($(this).val() / 100);
        $("#metronome").trigger("input");
    });
    $("#soprano").on("input", function () {
        $("#soprano_volume_text").val(Math.floor($(this).val() * 100));
    });
    $("#soprano_volume_text").on("input", function () {
        $("#soprano").val($(this).val() / 100);
        $("#soprano").trigger("input");
    });
    $("#alto").on("input", function () {
        $("#alto_volume_text").val(Math.floor($(this).val() * 100));
    });
    $("#alto_volume_text").on("input", function () {
        $("#alto").val($(this).val() / 100);
        $("#alto").trigger("input");
    });
    $("#tenor").on("input", function () {
        $("#tenor_volume_text").val(Math.floor($(this).val() * 100));
    });
    $("#tenor_volume_text").on("input", function () {
        $("#tenor").val($(this).val() / 100);
        $("#tenor").trigger("input");
    });
    $("#bass").on("input", function () {
        $("#bass_volume_text").val(Math.floor($(this).val() * 100));
    });
    $("#bass_volume_text").on("input", function () {
        $("#bass").val($(this).val() / 100);
        $("#bass").trigger("input");
    });
});