// SEO 설정 객체
const seoConfig = {
    title: "Zexchat - Anonymous Random Chat",
    description: "Zexchat - Connect with strangers for free, anonymous random chats anytime. Start talking now!",
    keywords: "random chat, anonymous chat, talk to strangers, private chat, instant messaging, encrypted chat",
    author: "Zexchat Team",
    siteUrl: "https://zexchat.com", // 실제 도메인 적용
    image: "https://zexchat.com/images/zexchat-banner.png" // 실제 이미지 URL 적용
};

// 메타 태그 및 소셜 미디어 태그 동적 추가
function addSEOTags() {
    // Title 설정
    document.title = seoConfig.title;

    // 메타 태그 리스트
    const metaTags = [
        { name: "description", content: seoConfig.description },
        { name: "keywords", content: seoConfig.keywords },
        { name: "author", content: seoConfig.author },
        { name: "robots", content: "index, follow" },
        // Open Graph (소셜 미디어용)
        { property: "og:title", content: seoConfig.title },
        { property: "og:description", content: seoConfig.description },
        { property: "og:url", content: seoConfig.siteUrl },
        { property: "og:type", content: "website" },
        { property: "og:image", content: seoConfig.image },
        // Twitter Card
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: seoConfig.title },
        { name: "twitter:description", content: seoConfig.description },
        { name: "twitter:image", content: seoConfig.image },
        // Canonical URL (중복 페이지 방지)
        { rel: "canonical", href: seoConfig.siteUrl }
    ];

    // 메타 태그 추가
    metaTags.forEach(tag => {
        const meta = document.createElement(tag.name ? "meta" : "link");
        Object.keys(tag).forEach(key => meta.setAttribute(key, tag[key]));
        document.head.appendChild(meta);
    });

    // H1 태그 적용 (SEO 최적화)
    const siteName = document.getElementById("site-name");
    if (siteName) {
        const h1 = document.createElement("h1");
        h1.id = "site-name";
        h1.textContent = seoConfig.title;
        siteName.replaceWith(h1);
    }

    // SEO용 숨겨진 설명 추가 (검색엔진 최적화)
    const introText = document.createElement("div");
    introText.id = "intro-text";
    introText.textContent = "Welcome to Zexchat, your go-to place for anonymous random chats. Connect with strangers worldwide instantly!";
    introText.style.display = "none";
    document.body.appendChild(introText);

    // 구조화된 데이터 (Schema.org)
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "ChatRoom",
        "name": "Zexchat",
        "url": seoConfig.siteUrl,
        "description": seoConfig.description
    };

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);
}

// 페이지 로드 시 SEO 적용
window.addEventListener("load", addSEOTags);

// 디버깅용: 현재 SEO 상태 출력
console.log("SEO Config Loaded:", seoConfig);