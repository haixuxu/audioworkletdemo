// 每次处理的音频数据长度 相当于 40ms/次 往外抛的频率
const MAX_NUM = 1700;

const float32Array2Int16Array = (source) => {
    let intArray = new Int16Array(source.length);
    for (let i = 0; i < source.length; i++) {
        if (source[i] < 0) {
            source[i] = source[i] * 32768;
        } else if (source[i] > 0) {
            source[i] = source[i] * 32767;
        }
        intArray[i] = Math.round(source[i]);
    }
    return intArray;
};



// 创建一个AudioWorklet处理器
class PCMProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        console.log("PCMProcessor====constructor====");
    }

    process(inputs, outputs, parameters) {
      console.log("====process", inputs);
        const input = inputs[0]; // 获取输入音频数据
        // const output = outputs[0] // 获取输出音频数据
        if (!this.audioData) {
            this.audioData = [];
        }
        if (input[0]) {
            this.audioData.push(...input[0]);
            if (this.audioData.length > MAX_NUM) {
                this.port.postMessage({
                    pcm: float32Array2Int16Array(this.audioData),
                });
                this.audioData = [];
            }
        }

        return true;
    }
}

registerProcessor("pcm-processor", PCMProcessor);
