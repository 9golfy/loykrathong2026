"use client";

import { useFormStatus } from "react-dom";
import { moderateAction } from "@/app/admin/actions";

function Buttons({ status }: { status: string }) {
  const { pending } = useFormStatus();
  return <div className="admin-row-actions">
    {status !== "APPROVED" && <button type="submit" name="status" value="APPROVED" className="admin-approve" disabled={pending}>{pending ? "กำลังบันทึก…" : status === "HIDDEN" ? "เผยแพร่อีกครั้ง" : "เผยแพร่"}</button>}
    {status !== "HIDDEN" && <button type="submit" name="status" value="HIDDEN" className="admin-hide" disabled={pending}>ซ่อน</button>}
    {status !== "PENDING" && <button type="submit" name="status" value="PENDING" disabled={pending}>ส่งกลับรอตรวจ</button>}
  </div>;
}

export default function AdminModerationForm({ id, status, filter }: { id: string; status: string; filter: string }) {
  return <form action={moderateAction}>
    <input type="hidden" name="id" value={id} /><input type="hidden" name="previous" value={status} /><input type="hidden" name="filter" value={filter} />
    <Buttons status={status} />
  </form>;
}
