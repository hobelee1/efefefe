const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const CroxyDB = require('croxydb');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('uptime-kur')
        .setDescription('Link ekleyebilir veya silebilirsiniz.'),
    async execute(interaction) {
        console.log('Komut çalıştırılmaya başlandı');
        try {
            await interaction.deferReply({ ephemeral: true });
            console.log('Yanıt ertelendi');
            const userId = interaction.user.id;

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('linkEkle')
                        .setLabel('Link Ekle')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('linkSil')
                        .setLabel('Link Sil')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId('linklerim')
                        .setLabel('Linklerim')
                        .setStyle(ButtonStyle.Secondary)
                );

            await interaction.editReply({
                content: 'Link Ekle butonuna tıklayarak linkini ekleyebilirsin!\nLink Sil butonuna tıklayarak linkini silebilirsin!\nListe butonunu kullanarak linklerine bakabilirsin!',
                components: [row]
            });
            console.log('İlk mesaj gönderildi');

            const filter = i => i.user.id === interaction.user.id;
            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 300000 }); // 5 dakika

            collector.on('collect', async i => {
                console.log(`Buton tıklaması alındı: ${i.customId}`);
                try {
                    await i.deferUpdate();
                    if (i.customId === 'linkEkle') {
                        await handleLinkEkle(i, userId, row);
                    } else if (i.customId === 'linkSil') {
                        await handleLinkSil(i, userId, row);
                    } else if (i.customId === 'linklerim') {
                        await handleLinklerim(i, userId, row);
                    }
                } catch (error) {
                    console.error('Buton işlemi sırasında hata:', error);
                    await safeReply(i, { content: 'Bir hata oluştu. Lütfen tekrar deneyin.', ephemeral: true });
                }
            });

            collector.on('end', collected => {
                console.log(`Collector sona erdi. Toplanan etkileşim sayısı: ${collected.size}`);
                if (collected.size === 0) {
                    interaction.editReply({ content: 'İşlem zaman aşımına uğradı.', components: [] }).catch(console.error);
                }
            });
        } catch (error) {
            console.error('Komut yürütme hatası:', error);
            await safeReply(interaction, { content: 'Bir hata oluştu. Lütfen tekrar deneyin.', ephemeral: true });
        }
    },
};

async function handleLinkEkle(i, userId, row) {
    console.log('handleLinkEkle fonksiyonu başlatıldı');
    await i.editReply({ content: 'Eklemek istediğiniz linki yazın:', components: [] });
    try {
        const collected = await i.channel.awaitMessages({ 
            filter: m => m.author.id === userId, 
            max: 1, 
            time: 60000, // 1 dakika
            errors: ['time']
        });
        
        const link = collected.first().content;
        let links = CroxyDB.get(`links_${userId}`) || [];
        if (links.includes(link)) {
            await safeReply(i, { content: 'Bu link zaten ekli!', ephemeral: true });
        } else {
            links.push(link);
            CroxyDB.set(`links_${userId}`, links);
            await safeReply(i, { content: 'Link başarıyla eklendi!', ephemeral: true });
        }
    } catch (error) {
        console.error('Link ekleme sırasında hata:', error);
        await safeReply(i, { content: 'Zaman aşımı veya bir hata oluştu. Lütfen tekrar deneyin.', ephemeral: true });
    }
    await i.editReply({ content: 'İşlem tamamlandı.', components: [row] });
}

async function handleLinkSil(i, userId, row) {
    console.log('handleLinkSil fonksiyonu başlatıldı');
    await i.editReply({ content: 'Silmek istediğiniz linki yazın:', components: [] });
    try {
        const collected = await i.channel.awaitMessages({ 
            filter: m => m.author.id === userId, 
            max: 1, 
            time: 60000, // 1 dakika
            errors: ['time']
        });
        
        const link = collected.first().content;
        let links = CroxyDB.get(`links_${userId}`) || [];
        const index = links.indexOf(link);
        if (index > -1) {
            links.splice(index, 1);
            CroxyDB.set(`links_${userId}`, links);
            await safeReply(i, { content: 'Link başarıyla silindi!', ephemeral: true });
        } else {
            await safeReply(i, { content: 'Bu link bulunamadı!', ephemeral: true });
        }
    } catch (error) {
        console.error('Link silme sırasında hata:', error);
        await safeReply(i, { content: 'Zaman aşımı veya bir hata oluştu. Lütfen tekrar deneyin.', ephemeral: true });
    }
    await i.editReply({ content: 'İşlem tamamlandı.', components: [row] });
}

async function handleLinklerim(i, userId, row) {
    console.log('handleLinklerim fonksiyonu başlatıldı');
    const links = CroxyDB.get(`links_${userId}`) || [];
    if (links.length > 0) {
        await safeReply(i, { content: `Linkleriniz:\n${links.join('\n')}`, ephemeral: true });
    } else {
        await safeReply(i, { content: 'Henüz link eklememişsiniz.', ephemeral: true });
    }
    await i.editReply({ content: 'İşlem tamamlandı.', components: [row] });
}

async function safeReply(interaction, options) {
    try {
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(options);
        } else {
            await interaction.reply(options);
        }
    } catch (error) {
        console.error('Yanıt gönderme hatası:', error);
    }
}