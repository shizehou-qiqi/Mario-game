/**
 * AudioManager类 - 音频管理系统
 * 负责游戏音效和背景音乐的播放管理
 */
class AudioManager {
    constructor() {
        // 音频上下文
        this.audioContext = null;
        this.masterVolume = 0.7;
        this.sfxVolume = 0.8;
        this.musicVolume = 0.5;
        
        // 音频缓存
        this.audioBuffers = new Map();
        this.audioSources = new Map();
        
        // 音效配置
        this.soundEffects = {
            jump: { frequency: 440, duration: 0.1, type: 'square' },
            coin: { frequency: 800, duration: 0.2, type: 'sine' },
            enemyDefeat: { frequency: 200, duration: 0.3, type: 'sawtooth' },
            playerHurt: { frequency: 150, duration: 0.5, type: 'triangle' },
            powerUp: { frequency: 600, duration: 0.4, type: 'sine' },
            gameOver: { frequency: 100, duration: 1.0, type: 'triangle' },
            victory: { frequency: 523, duration: 0.8, type: 'sine' }
        };
        
        // 背景音乐配置
        this.backgroundMusic = {
            main: {
                tempo: 120,
                notes: [
                    { freq: 659, duration: 0.125 }, // E
                    { freq: 659, duration: 0.125 }, // E
                    { freq: 0, duration: 0.125 },   // rest
                    { freq: 659, duration: 0.125 }, // E
                    { freq: 0, duration: 0.125 },   // rest
                    { freq: 523, duration: 0.125 }, // C
                    { freq: 659, duration: 0.125 }, // E
                    { freq: 0, duration: 0.125 },   // rest
                    { freq: 784, duration: 0.25 },  // G
                    { freq: 0, duration: 0.25 },    // rest
                    { freq: 392, duration: 0.25 }   // G (lower)
                ]
            }
        };
        
        // 播放状态
        this.isInitialized = false;
        this.isMusicPlaying = false;
        this.currentMusicSource = null;
        this.musicLoopTimeout = null;
        
        // 初始化音频系统
        this.init();
        
        console.log('AudioManager created');
    }
    
    /**
     * 初始化音频系统
     */
    async init() {
        try {
            // 创建音频上下文（需要用户交互后才能启动）
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // 创建主音量节点
            this.masterGainNode = this.audioContext.createGain();
            this.masterGainNode.gain.value = this.masterVolume;
            this.masterGainNode.connect(this.audioContext.destination);
            
            // 创建音效和音乐的音量节点
            this.sfxGainNode = this.audioContext.createGain();
            this.sfxGainNode.gain.value = this.sfxVolume;
            this.sfxGainNode.connect(this.masterGainNode);
            
            this.musicGainNode = this.audioContext.createGain();
            this.musicGainNode.gain.value = this.musicVolume;
            this.musicGainNode.connect(this.masterGainNode);
            
            this.isInitialized = true;
            console.log('AudioManager initialized successfully');
            
        } catch (error) {
            console.warn('AudioManager initialization failed:', error);
            this.isInitialized = false;
        }
    }
    
    /**
     * 启动音频上下文（需要用户交互）
     */
    async resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
                console.log('AudioContext resumed');
            } catch (error) {
                console.warn('Failed to resume AudioContext:', error);
            }
        }
    }
    
    /**
     * 播放音效
     * @param {string} soundName - 音效名称
     * @param {Object} options - 播放选项
     */
    playSound(soundName, options = {}) {
        if (!this.isInitialized || !this.audioContext) {
            return;
        }
        
        // 确保音频上下文已启动
        this.resume();
        
        const soundConfig = this.soundEffects[soundName];
        if (!soundConfig) {
            console.warn(`Sound effect '${soundName}' not found`);
            return;
        }
        
        try {
            // 创建音效
            this.createSoundEffect(soundConfig, options);
        } catch (error) {
            console.warn(`Failed to play sound '${soundName}':`, error);
        }
    }
    
    /**
     * 创建音效
     * @param {Object} config - 音效配置
     * @param {Object} options - 播放选项
     */
    createSoundEffect(config, options = {}) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        // 设置音效参数
        oscillator.type = config.type || 'sine';
        oscillator.frequency.setValueAtTime(
            options.frequency || config.frequency, 
            this.audioContext.currentTime
        );
        
        // 设置音量包络
        const duration = options.duration || config.duration;
        const currentTime = this.audioContext.currentTime;
        
        gainNode.gain.setValueAtTime(0, currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + duration);
        
        // 连接音频节点
        oscillator.connect(gainNode);
        gainNode.connect(this.sfxGainNode);
        
        // 播放音效
        oscillator.start(currentTime);
        oscillator.stop(currentTime + duration);
        
        // 清理
        oscillator.onended = () => {
            oscillator.disconnect();
            gainNode.disconnect();
        };
    }
    
    /**
     * 播放复合音效（多个音调）
     * @param {string} soundName - 音效名称
     * @param {Array} frequencies - 频率数组
     */
    playChord(soundName, frequencies) {
        if (!this.isInitialized || !frequencies || frequencies.length === 0) {
            return;
        }
        
        const soundConfig = this.soundEffects[soundName];
        if (!soundConfig) {
            return;
        }
        
        // 为每个频率创建音效
        frequencies.forEach((freq, index) => {
            setTimeout(() => {
                this.createSoundEffect(soundConfig, { frequency: freq });
            }, index * 50); // 轻微延迟创建和声效果
        });
    }
    
    /**
     * 播放背景音乐
     * @param {string} musicName - 音乐名称
     */
    playBackgroundMusic(musicName = 'main') {
        if (!this.isInitialized || this.isMusicPlaying) {
            return;
        }
        
        const musicConfig = this.backgroundMusic[musicName];
        if (!musicConfig) {
            console.warn(`Background music '${musicName}' not found`);
            return;
        }
        
        this.isMusicPlaying = true;
        this.playMusicSequence(musicConfig);
        
        console.log(`Started background music: ${musicName}`);
    }
    
    /**
     * 播放音乐序列
     * @param {Object} musicConfig - 音乐配置
     */
    playMusicSequence(musicConfig) {
        if (!this.isMusicPlaying) {
            return;
        }
        
        let currentTime = this.audioContext.currentTime;
        const notes = musicConfig.notes;
        
        notes.forEach((note, index) => {
            if (note.freq > 0) {
                // 播放音符
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(note.freq, currentTime);
                
                // 音量包络
                gainNode.gain.setValueAtTime(0, currentTime);
                gainNode.gain.linearRampToValueAtTime(0.1, currentTime + 0.01);
                gainNode.gain.linearRampToValueAtTime(0.05, currentTime + note.duration * 0.8);
                gainNode.gain.linearRampToValueAtTime(0, currentTime + note.duration);
                
                oscillator.connect(gainNode);
                gainNode.connect(this.musicGainNode);
                
                oscillator.start(currentTime);
                oscillator.stop(currentTime + note.duration);
                
                // 清理
                oscillator.onended = () => {
                    oscillator.disconnect();
                    gainNode.disconnect();
                };
            }
            
            currentTime += note.duration;
        });
        
        // 循环播放
        const totalDuration = notes.reduce((sum, note) => sum + note.duration, 0);
        this.musicLoopTimeout = setTimeout(() => {
            if (this.isMusicPlaying) {
                this.playMusicSequence(musicConfig);
            }
        }, totalDuration * 1000);
    }
    
    /**
     * 停止背景音乐
     */
    stopBackgroundMusic() {
        this.isMusicPlaying = false;
        
        if (this.musicLoopTimeout) {
            clearTimeout(this.musicLoopTimeout);
            this.musicLoopTimeout = null;
        }
        
        if (this.currentMusicSource) {
            try {
                this.currentMusicSource.stop();
            } catch (error) {
                // 忽略已经停止的音源错误
            }
            this.currentMusicSource = null;
        }
        
        console.log('Background music stopped');
    }
    
    /**
     * 设置主音量
     * @param {number} volume - 音量 (0-1)
     */
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        if (this.masterGainNode) {
            this.masterGainNode.gain.setValueAtTime(
                this.masterVolume, 
                this.audioContext.currentTime
            );
        }
    }
    
    /**
     * 设置音效音量
     * @param {number} volume - 音量 (0-1)
     */
    setSfxVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        if (this.sfxGainNode) {
            this.sfxGainNode.gain.setValueAtTime(
                this.sfxVolume, 
                this.audioContext.currentTime
            );
        }
    }
    
    /**
     * 设置音乐音量
     * @param {number} volume - 音量 (0-1)
     */
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.musicGainNode) {
            this.musicGainNode.gain.setValueAtTime(
                this.musicVolume, 
                this.audioContext.currentTime
            );
        }
    }
    
    /**
     * 静音/取消静音
     * @param {boolean} muted - 是否静音
     */
    setMuted(muted) {
        if (this.masterGainNode) {
            this.masterGainNode.gain.setValueAtTime(
                muted ? 0 : this.masterVolume, 
                this.audioContext.currentTime
            );
        }
    }
    
    /**
     * 播放特殊音效序列
     * @param {string} sequenceName - 序列名称
     */
    playSequence(sequenceName) {
        switch (sequenceName) {
            case 'levelComplete':
                // 胜利音效序列
                const victoryNotes = [523, 659, 784, 1047]; // C, E, G, C (高音)
                victoryNotes.forEach((freq, index) => {
                    setTimeout(() => {
                        this.createSoundEffect(this.soundEffects.victory, { 
                            frequency: freq, 
                            duration: 0.3 
                        });
                    }, index * 200);
                });
                break;
                
            case 'gameOver':
                // 游戏结束音效序列
                const gameOverNotes = [392, 370, 349, 330]; // 下降音调
                gameOverNotes.forEach((freq, index) => {
                    setTimeout(() => {
                        this.createSoundEffect(this.soundEffects.gameOver, { 
                            frequency: freq, 
                            duration: 0.4 
                        });
                    }, index * 300);
                });
                break;
                
            case 'powerUp':
                // 能力提升音效序列
                const powerUpNotes = [523, 659, 784, 1047, 1319]; // 上升音阶
                powerUpNotes.forEach((freq, index) => {
                    setTimeout(() => {
                        this.createSoundEffect(this.soundEffects.powerUp, { 
                            frequency: freq, 
                            duration: 0.15 
                        });
                    }, index * 100);
                });
                break;
        }
    }
    
    /**
     * 获取音频状态
     * @returns {Object} 音频状态信息
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            isMusicPlaying: this.isMusicPlaying,
            masterVolume: this.masterVolume,
            sfxVolume: this.sfxVolume,
            musicVolume: this.musicVolume,
            contextState: this.audioContext ? this.audioContext.state : 'not created'
        };
    }
    
    /**
     * 销毁音频管理器
     */
    destroy() {
        this.stopBackgroundMusic();
        
        if (this.audioContext) {
            try {
                this.audioContext.close();
            } catch (error) {
                console.warn('Error closing AudioContext:', error);
            }
        }
        
        this.audioBuffers.clear();
        this.audioSources.clear();
        
        console.log('AudioManager destroyed');
    }
}

// 导出AudioManager类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioManager;
} else {
    window.AudioManager = AudioManager;
}