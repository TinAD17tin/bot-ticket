const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const TicketSetupSchema = require('../../Schema/TicketSetupSchema');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket_panel_sup')
    .setDescription('Supprime la configuration du système de tickets.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const guildId = interaction.guild.id;

    try {
      const result = await TicketSetupSchema.findOneAndDelete({ guildId });

      if (!result) {
        return interaction.reply({ content: 'Aucune configuration de ticket trouvée pour ce serveur.', ephemeral: true });
      }

      const channel = await interaction.client.channels.fetch(result.channelId).catch(() => null);
      if (channel) {
        const messages = await channel.messages.fetch();
        const ticketPanelMessage = messages.find(msg => msg.components.some(comp => comp.customId === 'create_ticket'));
        if (ticketPanelMessage) {
          await ticketPanelMessage.delete();
        }
      }

      await interaction.reply({ content: 'La configuration du système de tickets a été supprimée. Vous pouvez maintenant reconfigurer le système de tickets avec la commande `/ticket_setup`.', ephemeral: true });

    } catch (error) {
      console.error('Erreur lors de la suppression de la configuration du système de tickets:', error);
      await interaction.reply({ content: 'Une erreur est survenue lors de la suppression de la configuration du système de tickets.', ephemeral: true });
    }
  },
};
