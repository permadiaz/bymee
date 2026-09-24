import { sections } from "./prompts";
import type { Analysis, RunInput } from "./types";
export function demoAnalysis(input: RunInput): Analysis {
  const f = input.fields;
  const context =
    f["Raw notes"] ||
    f.Message ||
    f.Context ||
    f.Notes ||
    Object.entries(f)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");
  const company =
    f.Company?.trim() ||
    ["Nusantara Logistik", "Karya Retail", "Sagara Teknologi"].find((name) =>
      context.toLowerCase().includes(name.toLowerCase()),
    ) ||
    context.match(
      /(?:PT\.?|CV\.?)\s+[A-Z][\w&-]*(?:\s+[A-Z][\w&-]*){0,3}/,
    )?.[0] ||
    "";
  const detectedType =
    f.Type && f.Type !== "Auto Detect"
      ? f.Type
      : /meeting|ketemu|rapat|diskusi/i.test(context)
        ? "Meeting"
        : /riset|research|perusahaan/i.test(context)
          ? "Research"
          : /masalah|kendala|problem/i.test(context)
            ? "Problem"
            : /ide|idea/i.test(context)
              ? "Idea"
              : "Document";
  const questions = [
    "Bagaimana proses yang berjalan saat ini?",
    "Di mana hambatan paling besar bagi tim?",
    "Apa dampaknya terhadap biaya atau waktu?",
    "Siapa yang terlibat dalam keputusan?",
    "Kapan evaluasi solusi berikutnya dilakukan?",
  ];
  const starters = [
    "Apa prioritas tim kuartal ini?",
    "Bagaimana pembagian tanggung jawab pusat dan cabang?",
    "Apa yang sudah berjalan baik?",
    "Apa yang mendorong evaluasi solusi?",
    "Bolehkah kita memetakan proses bersama?",
  ];
  const next = `Konfirmasi kebutuhan${company ? ` ${company}` : ""}, PIC yang tepat, dan waktu diskusi lanjutan.`;
  const draft = `Terima kasih atas informasinya${f.Contact ? `, ${f.Contact}` : ""}. Agar tindak lanjut kami sesuai kebutuhan, boleh dibantu konfirmasi prioritas utama dan pihak yang perlu dilibatkan? Apakah ada waktu yang cocok untuk diskusi singkat?`;
  const content: Record<string, string[]> = {
    Summary: [context],
    "What matters": [
      `Kategori masukan: ${detectedType}. Pisahkan informasi yang sudah jelas dari asumsi sebelum menindaklanjuti.`,
    ],
    "What the company does": [
      "Data tidak tersedia secara publik. Konfirmasi layanan utama dan profil pelanggan perusahaan.",
    ],
    "Why this account matters": [
      f["Visit objective"]
        ? `Tujuan kunjungan: ${f["Visit objective"]}. Validasi relevansi akun terhadap tujuan tersebut.`
        : "Relevansi akun belum tervalidasi. Cari kebutuhan yang benar-benar sesuai solusi.",
    ],
    "Important context": [context],
    "Opportunity summary": [
      f.Opportunity ||
        "Peluang belum terdefinisi. Validasi kebutuhan bersama PIC.",
    ],
    "Possible stakeholders": [
      f["Decision maker"] ||
        "Hipotesis: pemilik kebutuhan, IT, procurement, finance, dan pemberi persetujuan.",
    ],
    "Business signals": [
      "Cari bukti ekspansi, perubahan operasional, atau jadwal evaluasi kontrak; belum ada sinyal publik yang diverifikasi.",
    ],
    "Technology & business opportunities": [
      "Hipotesis: efisiensi operasional dan visibilitas biaya dapat menjadi sudut eksplorasi.",
    ],
    "Business implications": [
      "Jika hambatan operasional terkonfirmasi, ukur dampaknya terhadap waktu kerja dan biaya (IDR).",
    ],
    "Hypotheses to validate": [
      "Validasi apakah ada masalah yang mendesak, pemilik anggaran, dan kesediaan melakukan evaluasi.",
    ],
    Opportunity: [
      "Belum ada peluang tervalidasi. Konfirmasi kebutuhan dan izin membahas solusi.",
    ],
    "Likely pain points": [
      "Proses manual mungkin menyita waktu.",
      "Koordinasi lintas tim mungkin menghambat keputusan.",
      "Visibilitas biaya atau penggunaan mungkin terbatas.",
    ],
    "Conversation starters": starters,
    "Discovery questions": questions,
    Questions: questions,
    "Do not pitch too early": [
      "Hindari harga, diskon, dan janji migrasi sebelum memahami kebutuhan dan batasan teknis.",
    ],
    "Minimum successful outcome": [
      "Mendapatkan PIC yang tepat, satu kebutuhan tervalidasi, dan izin untuk tindak lanjut.",
    ],
    "Information to discover": [
      "Prioritas, pemilik anggaran, proses persetujuan, kontrak aktif, dan jadwal evaluasi.",
    ],
    "Missing information": [
      "Validasi anggaran (IDR), otoritas keputusan, kebutuhan, dan timeline.",
    ],
    Risks: [
      "Kebutuhan dan otoritas belum tervalidasi. Jangan menjanjikan hasil atau harga.",
    ],
    "Risks / blockers": [
      "Pastikan proses persetujuan, kepemilikan IT, dan kontrak aktif sebelum melangkah.",
    ],
    "Red flags": ["Belum cukup bukti untuk menyimpulkan red flag."],
    "Buying signals": [
      "Belum ada sinyal pembelian yang tervalidasi; konfirmasi urgensi dan komitmen langkah berikutnya.",
    ],
    "Opportunity strength": [
      "Belum dapat dinilai. Kebutuhan, anggaran, dan proses keputusan perlu dikonfirmasi.",
    ],
    "Target PIC / department": [
      f["Target PIC"] ||
        "Konfirmasi pemilik kebutuhan dan pengambil keputusan.",
    ],
    "Meeting objective": [
      f["Meeting objective"] ||
        "Validasi kebutuhan dan sepakati langkah berikutnya.",
    ],
    "Desired next step": [next],
    "Response strategy": [
      "Akui permintaan, klarifikasi informasi yang kurang, dan sepakati langkah konkret.",
    ],
    "Suggested response": [draft],
    "Suggested follow-up": [draft],
    "New contacts": [
      f.Contact ||
        "Belum ada kontak terstruktur. Periksa catatan dan konfirmasi nama serta peran.",
    ],
    "Important facts discovered": [context],
    "Important facts": [context],
    "Important information": [context],
    "Interaction summary": [context],
    "CRM-ready note": [
      `Akun: ${company || "Belum ditentukan"}. Kontak: ${f.Contact || "Belum ditentukan"}. Catatan: ${context}. Tindak lanjut: ${next}`,
    ],
    "Known context": [context],
    "Account context": [context],
    "Solution angle": [
      f["Product / solution"]
        ? `Validasi apakah ${f["Product / solution"]} sesuai kebutuhan; jangan mengasumsikan kecocokan.`
        : "Petakan kebutuhan sebelum memilih solusi.",
    ],
    "Potential objections": [
      "Prioritas belum jelas, biaya, dan risiko perubahan proses. Validasi langsung.",
    ],
    "Talking points": [
      "Mulai dari tujuan pelanggan, pahami hambatan, lalu sepakati langkah kecil.",
    ],
    "What they are asking": [
      "Contoh interpretasi: pelanggan memerlukan kejelasan dan langkah tindak lanjut. Periksa pesan asli sebelum mengirim.",
    ],
    "Evidence gaps": [
      "Data tidak tersedia secara publik. Mode demo tidak melakukan pencarian web.",
    ],
    "Recent information": [
      "Data tidak tersedia secara publik. Lakukan riset sumber terbaru.",
    ],
    "Recent developments": [
      "Data tidak tersedia secara publik. Lakukan riset sumber terbaru.",
    ],
    "Company overview": [
      company
        ? `${company} adalah akun yang ingin diteliti. Profil bisnis belum diverifikasi.`
        : "Nama perusahaan belum diberikan.",
    ],
    "Industry & business model": [
      "Data tidak tersedia secara publik. Konfirmasi industri dan model pendapatan.",
    ],
  };
  const facts = new Set([
    "Important facts discovered",
    "Important facts",
    "Important information",
    "Known context",
    "Account context",
    "Interaction summary",
    "CRM-ready note",
  ]);
  return {
    title:
      input.mode === "canvassing"
        ? "60-Second Brief"
        : (
            {
              inbox: "Inbox clarity",
              research: "Company research",
              meeting: "Meeting brief",
              opportunity: "Opportunity analysis",
              intel: "INTEL ENGINE",
              response: "Before I Respond",
              debrief: "Interaction debrief",
            } as Record<string, string>
          )[input.mode],
    company,
    summary: `Contoh analisis${company ? ` untuk ${company}` : ""}. ${context.slice(0, 260)}`,
    sections: sections[input.mode].map((title) => ({
      title,
      label: facts.has(title) ? "FACT" : "HYPOTHESIS",
      items: content[title] || [
        "Validasi kebutuhan, konteks bisnis, dan dampak operasional melalui diskusi dengan PIC.",
      ],
      ...(facts.has(title) ? { source: "User input — unverified" } : {}),
    })),
    nextAction: next,
    draft,
    contacts: f.Contact ? [f.Contact] : [],
    demo: true,
  };
}
