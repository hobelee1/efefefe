const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Bot ve API gecikmesini gösterir'),
    async execute(interaction) {
        const message = await interaction.reply({ content: 'Pong!', fetchReply: true });
        const latency = message.createdTimestamp - interaction.createdTimestamp; // Mesaj gecikmesi
        const apiLatency = Math.round(interaction.client.ws.ping); // API gecikmesi

        await interaction.editReply(`Pong! Mesaj gecikmesi: ${latency}ms, API gecikmesi: ${apiLatency}ms.`);
    }
};
