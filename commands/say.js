const { SlashCommandBuilder } = require('discord.js');
const db = require('croxydb');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('say')
        .setDescription('Veritabanındaki tüm linkleri sayar'),
    async execute(interaction) {
        // Manuel olarak bazı link anahtarlarını kontrol edelim
        const allKeys = ['links_1210259231807373343']; // Bu anahtarları manuel olarak gir
        const allLinks = [];

        // Her bir anahtarı kontrol et
        allKeys.forEach(key => {
            const links = db.get(key);

            // Eğer linkler bir dizi ise, bunları toplu dizimize ekleyelim
            if (Array.isArray(links)) {
                allLinks.push(...links);  // Diziyi mevcut linklerle birleştir
            }
        });

        // Sonuç: Toplam link sayısını kullanıcıya göster
        if (allLinks.length === 0) {
            await interaction.reply('Henüz eklenmiş bir link yok.');
        } else {
            await interaction.reply(`Toplamda ${allLinks.length} link var.`);
        }
    }
};
