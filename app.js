var processCode = `// 每次处理的音频数据长度 相当于 40ms/次 往外抛的频率
const MAX_NUM = 1700  

const float32Array2Int16Array = (source) => {
  let intArray = new Int16Array(source.length);
  for (let i = 0;i < source.length;i++) {
    if (source[i] < 0) {
      source[i] = source[i] * 32768
    } else if (source[i] > 0) {
      source[i] = source[i] * 32767
    }
    intArray[i] = Math.round(source[i]);
  }
  return intArray;
}


// 创建一个AudioWorklet处理器
class PCMProcessor extends AudioWorkletProcessor {

  process(inputs, outputs, parameters) {
    const input = inputs[0] // 获取输入音频数据
    // const output = outputs[0] // 获取输出音频数据
    if (!this.audioData) {
      this.audioData = []
    }
    console.log(this.port,inputs, Date.now());
    if (input[0]) {
      this.audioData.push(...input[0])
      if (this.audioData.length > MAX_NUM) {
        this.port.postMessage({
          pcm: float32Array2Int16Array(this.audioData)
        })
        this.audioData = []
      }
    }

    return true
  }

}

registerProcessor("pcm-processor", PCMProcessor)
`;
      let audioContext;
      let mediaStreamSource;
      let audioStream;
      let pcmProcessorNode;

      document
        .getElementById("startButton")
        .addEventListener("click", async () => {
          // 创建 AudioContext
          audioContext = new (window.AudioContext ||
            window.webkitAudioContext)();
          const blob = new Blob([processCode], {
            type: "application/javascript",
          });

          // 创建一个临时的 URL 以便下载
          const url = URL.createObjectURL(blob);

          try {
            // 加载 AudioWorkletProcessor
            await audioContext.audioWorklet.addModule(url);

            // 获取麦克风输入
            audioStream = await navigator.mediaDevices.getUserMedia({
              audio: true,
            });

            // 创建媒体流源节点
            mediaStreamSource =
              audioContext.createMediaStreamSource(audioStream);

            // 创建 PCM 处理器节点
            pcmProcessorNode = new AudioWorkletNode(
              audioContext,
              "pcm-processor"
            );

            // 连接节点：mediaStreamSource -> pcmProcessorNode -> destination
            mediaStreamSource
              .connect(pcmProcessorNode)
              .connect(audioContext.destination);

            // 更新按钮状态
            document.getElementById("startButton").disabled = true;
            document.getElementById("stopButton").disabled = false;
          } catch (error) {
            console.error("Error accessing microphone:", error);
          }
        });

      document.getElementById("stopButton").addEventListener("click", () => {
        // 停止音频流
        if (audioStream) {
          const tracks = audioStream.getTracks();
          tracks.forEach((track) => track.stop());
        }

        // 关闭 AudioContext
        if (audioContext) {
          audioContext.close();
        }

        // 更新按钮状态
        document.getElementById("startButton").disabled = false;
        document.getElementById("stopButton").disabled = true;
      });