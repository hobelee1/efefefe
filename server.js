const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource } = require('@discordjs/voice');
const axios = require('axios');
const fs = require('fs');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

// Botun Tokenini buraya ekleyin
const DISCORD_TOKEN = '';
const API_KEY = ''; // API anahtarını buraya ekleyin

// Bot hazır olduğunda çalışacak
client.once('ready', () => {
    console.log(`Bot ${client.user.tag} olarak giriş yaptı!`);
});

client.on('messageCreate', async (message) => {
    if (message.content.startsWith('!sor')) {
        const soru = message.content.replace('!sor', '').trim();

        // Google Generative AI modelini ayarla
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

        let sesDosyasiYolu = './yanit.mp3';
        let yanit;

        try {
            const result = await model.generateContent(soru);
            yanit = result.response.text(); // Yanıtı al
            console.log('Gemini Yanıtı:', yanit); // Yanıtı konsola yazdır

            // Metni 150 karakterlik parçalara ayır
            const parts = yanit.match(/.{1,150}/g);

            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];

                try {
                    const response = await axios.get(`https://www.msii.xyz/api/yaziyi-ses-yapma?text=${encodeURIComponent(part)}`, {
                        responseType: 'arraybuffer',
                    });
                    fs.appendFileSync(sesDosyasiYolu, response.data); // Her parça için MP3 olarak ekle
                    console.log(`Ses gönderildi: ${part}`); // Ses gönderildiğinde konsola yazdır
                } catch (error) {
                    console.error('TTS API hatası:', error);
                    message.reply('Yanıtı sesli hale getirmede bir sorun oluştu.');
                    return;
                }

                // Her istek arasında 3 saniye bekle
                await new Promise(resolve => setTimeout(resolve, 3000));
            }

        } catch (error) {
            console.error('API hatası:', error);
            message.reply('Yanıtı sesli hale getirmede bir sorun oluştu.');
            return;
        }

        // Kullanıcının Ses Kanalına Katıl ve Yanıtı Oynat
        if (message.member.voice.channel) {
            const connection = joinVoiceChannel({
                channelId: message.member.voice.channel.id,
                guildId: message.guild.id,
                adapterCreator: message.guild.voiceAdapterCreator,
            });

            const player = createAudioPlayer();
            const resource = createAudioResource(sesDosyasiYolu);

            player.play(resource);
            connection.subscribe(player);

            player.on('error', error => {
                console.error('Ses oynatmada hata:', error);
            });

            player.on('idle', () => {
                player.stop();
                connection.destroy(); // İş bittiğinde bağlantıyı sonlandır
                fs.unlinkSync(sesDosyasiYolu); // Geçici ses dosyasını sil
                console.log('Ses alındı.'); // Ses alındığında konsola yazdır
            });
        } else {
            message.reply('Lütfen bir ses kanalına katılın!');
        }
    }
});

// Botu çalıştır
client.login(DISCORD_TOKEN);
