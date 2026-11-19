"use client";

import { useFormStatus } from "react-dom";
import { deleteSubmissionAction, moderateAction } from "@/app/admin/actions";

function Buttons({ status, nickname, isPublic }: { status: string; nickname: string; isPublic: boolean }) {
  const { pending, action } = useFormStatus();
  const deleting = pending && action === deleteSubmissionAction;
  const publishing = pending && action === moderateAction;
  return <div className="admin-row-actions">
    {isPublic && status !== "APPROVED" && <button type="submit" name="status" value="APPROVED" className="admin-approve" disabled={pending}>{publishing ? "กำลังบันทึก…" : status === "HIDDEN" ? "เผยแพร่อีกครั้ง" : "เผยแพร่"}</button>}
    {isPublic && status !== "HIDDEN" && <button type="submit" name="status" value="HIDDEN" className="admin-hide" disabled={pending}>ซ่อน</button>}
    {isPublic && status !== "PENDING" && <button type="submit" name="status" value="PENDING" disabled={pending}>ส่งกลับรอตรวจ</button>}
    <button
      type="submit"
      formAction={deleteSubmissionAction}
      className="admin-delete"
      disabled={pending}
      aria-label={`ลบคำอธิษฐานของ ${nickname}`}
      onClick={(event) => {
        if (!window.confirm(`ลบคำอธิษฐานของ ${nickname} ถาวรหรือไม่? รายการที่ลบแล้วกู้คืนไม่ได้`)) event.preventDefault();
      }}
    >{deleting ? "กำลังลบ…" : "ลบ"}</button>
  </div>;
}

export default function AdminModerationForm({ id, status, filter, nickname }: { id: string; status: string; filter: string; nickname: string }) {
  return <form action={moderateAction}>
    <input type="hidden" name="id" value={id} /><input type="hidden" name="previous" value={status} /><input type="hidden" name="filter" value={filter} />
    <Buttons status={status} nickname={nickname} isPublic={filter !== "PRIVATE"} />
  </form>;
}
