// プログレスバーのデザイン
const activeColor = "#2d3985";
const inactiveColor = "#dddddd";

let isPlaying = false;
let isRepeat = false;
let isFirstPlayed = false;
let startTime = 0;
let sources = [];

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
        sources = Object.values(audioBuffers).map(part => {
            let source = audioContext.createBufferSource();    // 再生用のノードを作成
            source.buffer = part;    // オーディオバッファをノードに設定
            source.connect(audioContext.destination);    // 出力先設定
            source.start();    // 再生
            source.onended = handleEnded; // 再生終了時の処理を設定
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
        sources = Object.values(audioBuffers).map(part => {
            let source = audioContext.createBufferSource();    // 再生用のノードを作成
            source.buffer = part;    // オーディオバッファをノードに設定
            source.connect(audioContext.destination);    // 出力先設定
            source.start();    // 再生
            source.onended = handleEnded; // 再生終了時の処理を設定
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
    $(".inputRange").on("input", function () {
        setRangeStyle(this);
        const newTime = audioBuffers.metronome.duration * (this.value / 100);
        startTime = audioContext.currentTime - newTime;
        currentTime.text(convertTimeFormat(newTime));
        sources.forEach((source, index) => {
            source.stop();
            let newSource = audioContext.createBufferSource();
            newSource.buffer = source.buffer;
            newSource.connect(audioContext.destination);
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
            newSource.connect(audioContext.destination);
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