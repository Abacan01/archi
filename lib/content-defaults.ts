import type { SiteContent } from "./content-types";

export const defaultSiteContent: SiteContent = {
  global: {
    brand: { mark: "JC", text: "JCCHUA & Associates" },
    navItems: [
      { href: "/", label: "Home" },
      { href: "/about", label: "About" },
      { href: "/projects", label: "Projects" },
      { href: "/gallery", label: "Gallery View" },
      { href: "/contact", label: "Contact" },
      { href: "/login", label: "Login" },
    ],
    footer: {
      text: "(c) 2026 JCCHUA & Associates. All rights reserved.",
      socialLinks: [
        { label: "Facebook", href: "https://www.facebook.com/realter.joseph/", icon: "facebook" },
        { label: "LinkedIn", href: "https://linkedin.com/in/digiscribe", icon: "linkedin" },
      ],
      badges: [
        {
          label: "Batangas Estates",
          href: "http://www.batangasestates.com/",
          imageUrl: "/assets/images/batangasestates4.jpg",
          imageAlt: "Batangas Estates",
        },
        {
          label: "Vicmar Homes",
          href: "http://www.vicmarhomes.com/",
          imageUrl: "/assets/images/vicmarhomeslogo.png",
          imageAlt: "Vicmar Homes",
        },
      ],
    },
  },
  home: {
    eyebrow: "Practical. Sustainable. Human-centered.",
    title: "Architecture has evolved into the design of a lifestyle.",
    paragraphs: [
      "We do not only consider building use in design. We also consider carbon footprint, social effects, and impact on users and neighbors. Each design element is evaluated for energy, social, and environmental costs.",
      "We harness natural resources available on site, from the sun, wind, and rain, to the trees and rivers that surround each project.",
    ],
    actions: [
      { label: "Explore Projects", href: "/projects", variant: "primary" },
      { label: "Get in touch", href: "/contact", variant: "outline" },
    ],
    featuredDesign: {
      eyebrow: "Featured Design",
      title: "Clean frontage studies",
      description: "Facade compositions that balance proportion, shade, and a clear architectural identity.",
      imageUrl: "/assets/images/lgv.avif",
      imageAlt: "Featured frontage architectural design",
    },
    tiles: [
      {
        tag: "Site View",
        title: "Aerial Planning",
        description: "Bird's-eye massing and site organization studies.",
        imageUrl: "/assets/images/aerial view.avif",
        imageAlt: "Aerial view of an architectural project",
      },
      {
        tag: "Interior View",
        title: "Living Space Studies",
        description: "Interior studies focused on light, circulation, and comfort.",
        imageUrl: "/assets/images/living area.avif",
        imageAlt: "Interior living area design",
      },
    ],
    portfolioTitle: "Residential and Commercial Portfolio",
    portfolioNote: "",
  },
  about: {
    pageTitle: "Arch. Joseph C. Chua, LRA, PAREB-QCRB",
    sidebarImageUrl: "/assets/images/joseph-chua-portrait.jpg",
    sidebarImageAlt: "Arch. Joseph C. Chua",
    sidebarName: "Arch. Joseph C. Chua",
    sidebarSubtitle: "Architect / Realtor\nEnvironmental Planner",
    licenseNumbers: [
      "Architect PRC # 012331",
      "REB Lic # 007256",
      "EnP Lic 2957",
      "Plumbing Engr PRC # 02197",
    ],
    specializations: ["Green Architecture", "Fire Safety", "Design Consultancy", "Project Management"],
    profileHeading: "Arch. Joseph C. Chua",
    profileParagraphs: [
      "University of the Philippines, College of Architecture / Batch '94, Cum Laude / Phi Kappa Phi Honor Society",
    ],
    profilePills: [
      "Architect",
      "Plumbing Engineer",
      "Real Estate Broker",
      "Environmental Planner",
      "Fire Safety Practitioner",
      "Pollution Control Officer",
    ],
    keyLicenses: [
      { title: "Registered Architect", meta: "Since 1995" },
      { title: "Master Plumber & Plumbing Engineer", meta: "Since 1996" },
      { title: "Licensed Real Estate Broker", meta: "Since 1997" },
      { title: "Environmental Planner & Fire Safety Practitioner", meta: "" },
    ],
    memberships: [
      { title: "NAMPAP", meta: "National Master Plumbers Assoc. of the Phils." },
      { title: "PAREB", meta: "Phil. Association of Real Estate Boards" },
      { title: "QCRB", meta: "Quezon City Real Estate Board" },
      { title: "Phi Kappa Phi Honor Society", meta: "" },
    ],
    award: {
      text:
        "Arch. Joseph C. Chua received the award for Aventi Townhomes during the 2013 Philippines Property Awards Night. Aventi Townhomes was also recognized by the South East Asia Property Awards 2013, held in Singapore - honoring excellence in property development across the region.",
      imageUrl: "/assets/images/award.avif",
      imageAlt: "Arch. Joseph C. Chua receiving an award for Aventi Townhomes",
    },
    architectureTitle: "Site-specific design for resilience and long-term value",
    principles: [
      "Each project is a unique project. We design each space, wall, window, toilet, stairs, and roof to suit the natural flow of wind, sun and rain in each site. We consider earthquake movements and ease of maintenance of each building. We also consider social interactions of each family member in a residential project.",
      "We always encourage flexibility in designing spaces, as buildings should be able to grow, as the users grow. We believe Architecture can help both the users and the building structure, live a fruitful life thru the values of in depth architectural planning and foresight.",
      "Proper architectural design also helps reduce our maintenance costs for the buildings, as well as help us reduce our environmental costs. A good architecture design is sustainable and resilient over the passage of time.",
    ],
    servicesTitle: "Architectural Consultancy Services",
    services: [
      {
        title: "Architectural Design Services",
        paragraphs: [
          "We offer schematic design, design development, conceptual design development, and detailing for building projects. We accept designs for residential, commercial, warehouse complex, factories, and resort projects. We provide construction drawings and building permit drawings.",
          "Our designs are climate sensitive, which means we always design using the climate and our environment as one of our tools and design elements. This provides a great cost savings for the owners over the lifetime of the building.",
        ],
      },
      {
        title: "Design - Build Services",
        paragraphs: [
          "We offer design build services for clients who want the same designer to undergo the construction process. We offer lump sum contracts as well as cost plus contracts. We charge separately for the design component of the Design-Build services. We do not do Free Designs, as all our design work is done meticulously, and these are all client specific, site specific and budget specific.",
          "We design climate sensitive designs, giving due considerations to local climate, energy consumption and water consumption for all our projects, giving a lifetime of savings for our clients.",
        ],
      },
      {
        title: "Physical Planning and Master Plan development",
        paragraphs: [
          "We provide services in large scale masterplanning services and physical planning for mid sized projects. We can provide conceptual design proposals for each project to make it unique and sellable to the target market.",
          "Our masterplans are also climate and cost sensitive to benefit the client, users and the general public.",
        ],
      },
      {
        title: "GREEN ARCHITECTURE & GREEN PLUMBING ENGINEERING",
        paragraphs: [
          "We offer Green Architecture and Green Plumbing Engineering Services to some specific projects. While we do integrate Green Architecture in all our design projects, some clients can specifically request for extra Green Architecture features. Most of our applications for green architecture use passive design features. We can design buildings to use active green design features if requested, such as use of solar panels, recirculating rain water cooling system, and more.",
        ],
      },
    ],
  },
  projectsPage: {
    portfolioTitle: "Residential and Commercial Portfolio",
    filterLabels: ["All Projects", "Residential", "Commercial"],
    spotlight: {
      title: "Mckinley West Residence",
      type: "Residential",
      description: "A climate-responsive residence balancing privacy, airflow, and long-term maintenance efficiency.",
      moreDetailsUrl: "",
      points: ["Climate-sensitive planning", "Cost-aware design decisions", "Resilient material strategy"],
      imageUrl: "/assets/images/mckinley-west-residence.jpg",
      imageAlt: "Featured project image",
    },
    spotlightTwo: {
      title: "Featured Architecture",
      type: "Residential",
      description: "Architectural project showcasing design excellence and innovative spatial solutions.",
      moreDetailsUrl: "",
      points: ["Design innovation", "Spatial efficiency", "Material quality"],
      imageUrl: "",
      imageAlt: "Project image",
    },
    spotlightThree: {
      title: "Contemporary Design",
      type: "Commercial",
      description: "A carefully crafted architectural response to contemporary design challenges and client aspirations.",
      moreDetailsUrl: "",
      points: ["Contemporary design", "Client focused", "Sustainable approach"],
      imageUrl: "",
      imageAlt: "Project image",
    },
    spotlightFour: {
      title: "Architectural Excellence",
      type: "Residential",
      description: "An exploration of form, function, and the seamless integration of architecture within its context.",
      moreDetailsUrl: "",
      points: ["Contextual design", "Functional beauty", "Environmental harmony"],
      imageUrl: "",
      imageAlt: "Project image",
    },
    additionalSpotlights: [],
  },
  projectItems: [
    {
      title: "Mckinley West Residence",
      category: "Residential",
      status: "Completed",
      year: 2024,
      slug: "mckinley-west-residence",
      descriptionText: "A climate-responsive residence balancing privacy, airflow, and long-term maintenance efficiency.",
      coverImageUrl: "/assets/images/mckinley-west-residence.jpg",
      coverImageAlt: "Mckinley West Residence exterior",
      gallery: [
        {
          imageUrl: "/assets/images/Aventi Townhomes.avif",
          imageAlt: "Residential facade perspective",
        },
        {
          imageUrl: "/assets/images/front elevation.avif",
          imageAlt: "Front elevation drawing",
        },
      ],
    },
    {
      title: "Sta Mesa Office Building",
      category: "Commercial",
      status: "Under Construction",
      year: 2023,
      slug: "sta-mesa-office-building",
      descriptionText: "An office building with flexible floor plates and a shaded facade strategy for the city core.",
      coverImageUrl: "/assets/images/sta-mesa-office-building.jpg",
      coverImageAlt: "Sta Mesa office building facade",
      gallery: [],
    },
  ],
  contact: {
    title: "Tell us what you are building",
    formTitle: "Project Inquiry Form",
    formIntro: "Please share your project details so we can prepare an informed architectural consultation.",
    officeHeading: "Office Location",
    officeMapUrl: "https://maps.google.com/maps?q=14.5475045,120.9977811&z=17&output=embed",
    officeMapLinkUrl:
      "https://www.google.com/maps/place/Nemar+Building/@14.5474107,120.9952397,17z/data=!4m7!3m6!1s0x3397c937056bd4cd:0xa7142874a79de38!8m2!3d14.5475045!4d120.9977811!15sCkEyNjVBIC0gTmVtYXIgQnVpbGRpbmcsIExpYmVydGFkIFN0LiBQYXNheSBDaXR5LCAxMzAwLiBQaGlsaXBwaW5lc5IBEmFwYXJ0bWVudF9idWlsZGluZ-ABAA!16s/g/11tx3rvcrx",
    officeMapLink: "Open full map",
    contactHeading: "Get in touch",
    contactName: "Arch. Joseph C. Chua",
    contactRoles: "Architect ~ Realtor ~ Environmental Planner ~ Plumbing Engineer",
    addressLines: ["265A - Nemar Building, Libertad St. Pasay City, 1300. Philippines."],
    phone: "+63-917-819-4131",
    email: "josephchua.2000@gmail.com",
  },
  gallery: {
    items: [
      {
        src: "/assets/images/aerial view.avif",
        alt: "Aerial architecture composition",
        title: "Morning Light",
        meta: "Photography - 2024",
      },
      {
        src: "/assets/images/Aventi Townhomes.avif",
        alt: "Aventi townhomes perspective",
        title: "Aventi Townhomes",
        meta: "Residential - 2024",
      },
      {
        src: "/assets/images/Aventi Townhomes Facade Entrance.avif",
        alt: "Townhome facade entrance detail",
        title: "Facade Entrance",
        meta: "Study - 2023",
      },
      {
        src: "/assets/images/front elevation.avif",
        alt: "Front elevation drawing",
        title: "Front Elevation",
        meta: "Design - 2023",
      },
      {
        src: "/assets/images/lgv.avif",
        alt: "Large glass volume concept",
        title: "LGV Concept",
        meta: "Concept - 2022",
      },
      {
        src: "/assets/images/living area.avif",
        alt: "Living area interior",
        title: "Living Area",
        meta: "Interior - 2022",
      },
      {
        src: "/assets/images/award.avif",
        alt: "Architectural award showcase",
        title: "Award Showcase",
        meta: "Feature - 2021",
      },
    ],
  },
};
