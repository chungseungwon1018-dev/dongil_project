import { PrismaClient } from "../lib/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { addDays, subDays, subMonths } from "date-fns"
import * as dotenv from "dotenv"
dotenv.config()

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  const adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } })
  if (!adminUser) {
    console.error("ADMIN 유저가 없습니다. 먼저 회원가입 후 관리자 권한을 부여하세요.")
    process.exit(1)
  }
  const userId = adminUser.id
  console.log(`Using user: ${adminUser.fullName} (${adminUser.username})`)

  // 거래처
  const clientData = [
    { name: "한국건설", shortCode: "HK", phone: "02-1234-5678", memo: "VIP 거래처" },
    { name: "서울유리", shortCode: "SY", phone: "02-9876-5432", memo: "정기 납품" },
    { name: "대한인테리어", shortCode: "DH", phone: "031-555-1234", memo: null },
    { name: "현대건축", shortCode: "HD", phone: "032-777-8888", memo: "현장 3곳" },
    { name: "강남리모델링", shortCode: "GN", phone: "010-1111-2222", memo: null },
    { name: "부산유리상사", shortCode: "BS", phone: "051-333-4444", memo: "부산 지역" },
  ]
  const clients: Record<string, string> = {}
  for (const c of clientData) {
    const existing = await prisma.client.findFirst({ where: { name: c.name } })
    if (existing) {
      clients[c.name] = existing.id
    } else {
      const created = await prisma.client.create({ data: c })
      clients[c.name] = created.id
    }
  }
  console.log(`거래처 ${Object.keys(clients).length}개 준비 완료`)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const ordersToCreate = [
    // 오늘 납품 예정 (대시보드 "오늘 납품 예정" 카드에 표시됨)
    {
      orderNumber: "ORD-2026-001",
      clientName: "한국건설",
      clientId: clients["한국건설"],
      siteName: "강남 오피스텔 A동",
      quantity: 24,
      area: 48.5,
      frameType: "12A",
      glassType: "TPS" as const,
      productName: "24mm TPS",
      status: "PRODUCTION_DONE" as const,
      orderReceivedDate: subDays(today, 10),
      productionRequestDate: subDays(today, 8),
      deliveryRequestDate: today,
      productionDate: subDays(today, 2),
      lots: [
        { lotName: "1조", quantity: 12, scheduledDate: subDays(today, 3), completedDate: subDays(today, 2) },
        { lotName: "2조", quantity: 12, scheduledDate: subDays(today, 2), completedDate: subDays(today, 1) },
      ],
    },
    // 지연 발주 (납품일 지났는데 출고 안됨)
    {
      orderNumber: "ORD-2026-002",
      clientName: "서울유리",
      clientId: clients["서울유리"],
      siteName: "마포 아파트 301호",
      quantity: 8,
      area: 12.0,
      frameType: "9A",
      glassType: "LAMINATED" as const,
      productName: "8.76 접합",
      status: "PRODUCTION" as const,
      orderReceivedDate: subDays(today, 15),
      productionRequestDate: subDays(today, 12),
      deliveryRequestDate: subDays(today, 3),
      productionDate: null,
      lots: [
        { lotName: "1조", quantity: 8, scheduledDate: subDays(today, 4), completedDate: null },
      ],
    },
    // 이번 주 납품 예정
    {
      orderNumber: "ORD-2026-003",
      clientName: "대한인테리어",
      clientId: clients["대한인테리어"],
      siteName: "송파 상가 2층",
      quantity: 16,
      area: 32.0,
      frameType: "12A",
      glassType: "TPS" as const,
      productName: "24mm TPS",
      status: "WAITING" as const,
      orderReceivedDate: subDays(today, 5),
      productionRequestDate: subDays(today, 3),
      deliveryRequestDate: addDays(today, 2),
      productionDate: null,
      lots: [],
    },
    // 완료된 발주
    {
      orderNumber: "ORD-2026-004",
      clientName: "현대건축",
      clientId: clients["현대건축"],
      siteName: "인천 주상복합 B동",
      quantity: 40,
      area: 80.0,
      frameType: "16A",
      glassType: "TRIPLE" as const,
      productName: "3중 복층",
      status: "SHIPPED" as const,
      orderReceivedDate: subDays(today, 30),
      productionRequestDate: subDays(today, 28),
      deliveryRequestDate: subDays(today, 15),
      productionDate: subDays(today, 18),
      shipmentDate: subDays(today, 14),
      noteDefect: "모서리 강화 처리 필요",
      lots: [
        { lotName: "1조", quantity: 20, scheduledDate: subDays(today, 20), completedDate: subDays(today, 19) },
        { lotName: "2조", quantity: 20, scheduledDate: subDays(today, 18), completedDate: subDays(today, 17) },
      ],
    },
    // 지난달 발주들 (월별 차트용)
    {
      orderNumber: "ORD-2026-005",
      clientName: "한국건설",
      clientId: clients["한국건설"],
      siteName: "광진 빌라 단지",
      quantity: 30,
      area: 55.0,
      frameType: "12A",
      glassType: "TPS" as const,
      productName: "24mm TPS",
      status: "SHIPPED" as const,
      orderReceivedDate: subDays(today, 45),
      productionRequestDate: subDays(today, 43),
      deliveryRequestDate: subDays(today, 32),
      productionDate: subDays(today, 35),
      shipmentDate: subDays(today, 30),
      lots: [],
    },
    {
      orderNumber: "ORD-2026-006",
      clientName: "강남리모델링",
      clientId: clients["강남리모델링"],
      siteName: "강남 주택 1층",
      quantity: 6,
      area: 9.5,
      frameType: "6A",
      glassType: "SINGLE" as const,
      productName: "단판 6mm",
      status: "SHIPPED" as const,
      orderReceivedDate: subDays(today, 50),
      productionRequestDate: subDays(today, 48),
      deliveryRequestDate: subDays(today, 40),
      productionDate: subDays(today, 42),
      shipmentDate: subDays(today, 38),
      lots: [],
    },
    {
      orderNumber: "ORD-2026-007",
      clientName: "부산유리상사",
      clientId: clients["부산유리상사"],
      siteName: "부산 오피스 3층",
      quantity: 20,
      area: 38.0,
      frameType: "12A",
      glassType: "TPS" as const,
      productName: "TPS 24mm",
      status: "SHIPPED" as const,
      orderReceivedDate: subDays(today, 60),
      productionRequestDate: subDays(today, 58),
      deliveryRequestDate: subDays(today, 48),
      productionDate: subDays(today, 50),
      shipmentDate: subDays(today, 45),
      lots: [],
    },
    // 2달 전 발주
    {
      orderNumber: "ORD-2026-008",
      clientName: "서울유리",
      clientId: clients["서울유리"],
      siteName: "용산 빌딩 로비",
      quantity: 12,
      area: 22.0,
      frameType: "9A",
      glassType: "LAMINATED" as const,
      productName: "접합 8.76",
      status: "SHIPPED" as const,
      orderReceivedDate: subMonths(today, 2),
      productionRequestDate: addDays(subMonths(today, 2), 2),
      deliveryRequestDate: addDays(subMonths(today, 2), 12),
      productionDate: addDays(subMonths(today, 2), 8),
      shipmentDate: addDays(subMonths(today, 2), 11),
      lots: [],
    },
    {
      orderNumber: "ORD-2026-009",
      clientName: "한국건설",
      clientId: clients["한국건설"],
      siteName: "성북 타운하우스",
      quantity: 35,
      area: 70.0,
      frameType: "16A",
      glassType: "TPS" as const,
      productName: "32mm TPS",
      status: "SHIPPED" as const,
      orderReceivedDate: subMonths(today, 2),
      productionRequestDate: addDays(subMonths(today, 2), 3),
      deliveryRequestDate: addDays(subMonths(today, 2), 15),
      productionDate: addDays(subMonths(today, 2), 11),
      shipmentDate: addDays(subMonths(today, 2), 14),
      lots: [],
    },
    // 오늘 생산 예정 조 (대시보드 "오늘 생산 예정 조" 카드)
    {
      orderNumber: "ORD-2026-010",
      clientName: "대한인테리어",
      clientId: clients["대한인테리어"],
      siteName: "양천 상가 인테리어",
      quantity: 18,
      area: 28.5,
      frameType: "12A",
      glassType: "TPS" as const,
      productName: "24mm TPS",
      status: "PRODUCTION" as const,
      orderReceivedDate: subDays(today, 6),
      productionRequestDate: subDays(today, 4),
      deliveryRequestDate: addDays(today, 4),
      productionDate: null,
      noteJoint: "접합 유리 별도 주문",
      lots: [
        { lotName: "1조", quantity: 10, scheduledDate: today, completedDate: null },
        { lotName: "2조", quantity: 8, scheduledDate: addDays(today, 1), completedDate: null },
      ],
    },
    // HOLD 상태
    {
      orderNumber: "ORD-2026-011",
      clientName: "현대건축",
      clientId: clients["현대건축"],
      siteName: "동대문 빌딩 외벽",
      quantity: 50,
      area: 120.0,
      frameType: "16A",
      glassType: "TRIPLE" as const,
      productName: "3중 복층 42mm",
      status: "HOLD" as const,
      orderReceivedDate: subDays(today, 7),
      productionRequestDate: subDays(today, 5),
      deliveryRequestDate: addDays(today, 10),
      productionDate: null,
      noteDefect: "설계 변경으로 보류",
      lots: [],
    },
    // 3달 전 발주
    {
      orderNumber: "ORD-2025-201",
      clientName: "강남리모델링",
      clientId: clients["강남리모델링"],
      siteName: "강남 오피스 리모델링",
      quantity: 22,
      area: 44.0,
      frameType: "12A",
      glassType: "TPS" as const,
      productName: "24mm TPS",
      status: "SHIPPED" as const,
      orderReceivedDate: subMonths(today, 3),
      productionRequestDate: addDays(subMonths(today, 3), 2),
      deliveryRequestDate: addDays(subMonths(today, 3), 12),
      productionDate: addDays(subMonths(today, 3), 8),
      shipmentDate: addDays(subMonths(today, 3), 11),
      lots: [],
    },
  ]

  let created = 0
  for (const o of ordersToCreate) {
    const { lots, ...orderData } = o
    const existing = await prisma.order.findFirst({ where: { orderNumber: o.orderNumber } })
    if (existing) {
      console.log(`  SKIP: ${o.orderNumber} (이미 존재)`)
      continue
    }
    const order = await prisma.order.create({
      data: {
        ...orderData,
        createdById: userId,
        activities: {
          create: { userId, action: "ORDER_CREATED" },
        },
      },
    })
    for (const lot of lots) {
      await prisma.productionLot.create({ data: { ...lot, orderId: order.id } })
    }
    created++
    console.log(`  CREATE: ${o.orderNumber} - ${o.clientName} (${o.status})`)
  }

  console.log(`\n완료: 발주 ${created}건 추가, 총 발주 수: ${await prisma.order.count()}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
