
(async function () {
    const { upsertArticle } = await import('./src/cms');

    await upsertArticle({
        title: "Bem-vindo ao Antas Basketball!",
        slug: "bem-vindo-antas-basketball",
        description: "Confira as últimas novidades e atualizações da nossa liga.",
        content: "# Bem-vindo!\n\nEste é o novo site do Antas Basketball. Aqui você encontrará notícias, estatísticas de campeões, hall of fame, e muito mais.\n\nFique ligado!",
        category: "INICIO",
        is_featured: true,
        published: true,
        published_at: new Date().toISOString()
    });

    console.log("Welcome post created!");
})();
