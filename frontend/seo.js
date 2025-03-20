// SEO 설정 객체
const seoConfig = {
    title: "Zexchat - Anonymous Random Chat",
    description: "Zexchat - Connect with strangers for free, anonymous random chats anytime. Start talking now!",
    keywords: "random chat, anonymous chat, stranger chat, free chat, Zexchat",
    author: "Zexchat Team",
    siteUrl: "https://zexchat-xxx.onrender.com", // 배포 후 실제 URL로 변경
    image: "https://raw.githubusercontent.com/[username]/zexchat/main/frontend/images/zexchat-banner.png", // 로고 URL (파일명 가정)
  };
  
  // 메타 태그 및 소셜 미디어 태그 동적 추가
  function addSEOTags() {
    // Title 설정
    document.title = seoConfig.title;
  
    // 기본 메타 태그
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
    ];
  
    metaTags.forEach(tag => {
      const meta = document.createElement("meta");
      if (tag.name) meta.name = tag.name;
      if (tag.property) meta.setAttribute("property", tag.property);
      meta.content = tag.content;
      document.head.appendChild(meta);
    });
  
    // Site name을 h1으로 변경
    const siteName = document.getElementById("site-name");
    if (siteName) {
      const h1 = document.createElement("h1");
      h1.id = "site-name";
      h1.textContent = "Zexchat";
      siteName.replaceWith(h1);
    }
  
    // Intro text 추가 (검색 엔진용, UI에선 숨김)
    const introText = document.createElement("div");
    introText.id = "intro-text";
    introText.textContent = "Welcome to Zexchat, your go-to place for anonymous random chats. Connect with strangers worldwide instantly!";
    introText.style.display = "none";
    document.getElementById("chat").insertBefore(introText, document.getElementById("messages"));
  
    // 구조화된 데이터 (JSON-LD)
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Zexchat",
      "url": seoConfig.siteUrl,
      "description": seoConfig.description,
      "potentialAction": {
        "@type": "SearchAction",
        "target": `${seoConfig.siteUrl}/?q={search_term_string}`,
        "query-input": "required name=search_term_string"
      }
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