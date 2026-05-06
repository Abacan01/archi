"use client";

import { InlineEditor } from "./inline-editor";
import { ArrayItemRemoveButton } from "./array-editor-button";
import type { ContactContent } from "../lib/content-types";

interface ContactCardProps {
  contact: ContactContent;
  isEditMode: boolean;
}

export function ContactCard({ contact, isEditMode }: ContactCardProps) {
  const phones = contact.phones || (contact.phone ? [{ number: contact.phone, label: "Phone" }] : []);
  const emails = contact.emails || (contact.email ? [{ address: contact.email, label: "Email" }] : []);

  return (
    <aside className="contact-card">
      <InlineEditor as="h3" path="contact.contactHeading" initialValue={contact.contactHeading} />
      <InlineEditor as="p" className="contact-name" path="contact.contactName" initialValue={contact.contactName} />
      <InlineEditor as="p" path="contact.contactRoles" initialValue={contact.contactRoles} />
      <dl className="contact-list">
        {(contact.addressLines || []).map((line, idx) => (
          <div key={idx} className="contact-list-row">
            <dt className="contact-list-label">Address</dt>
            <dd style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
              <InlineEditor path={`contact.addressLines[${idx}]`} initialValue={line} />
              {isEditMode && <ArrayItemRemoveButton path="contact.addressLines" index={idx} />}
            </dd>
          </div>
        ))}

        {phones.map((phone, idx) => (
          <div key={idx} className="contact-list-row">
            <dt className="contact-list-label">{phone.label || "Phone"}</dt>
            <dd style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
              <InlineEditor path={`contact.phones[${idx}].number`} initialValue={phone.number} />
              {isEditMode && <ArrayItemRemoveButton path="contact.phones" index={idx} />}
            </dd>
          </div>
        ))}

        {emails.map((email, idx) => (
          <div key={idx} className="contact-list-row">
            <dt className="contact-list-label">{email.label || "Email"}</dt>
            <dd style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
              <InlineEditor path={`contact.emails[${idx}].address`} initialValue={email.address} />
              {isEditMode && <ArrayItemRemoveButton path="contact.emails" index={idx} />}
            </dd>
          </div>
        ))}
      </dl>

      {isEditMode && (
        <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {/* Add buttons for admins to add new items */}
          <button
            type="button"
            onClick={async () => {
              const { db, doc, updateDoc, getDoc } = await import("firebase/firestore");
              if (!db) return;
              const contentSnap = await getDoc(doc(db, "siteContent", "main"));
              if (!contentSnap.exists()) return;
              const data = contentSnap.data();
              const newPhones = [...(data.contact?.phones || []), { number: "", label: "Phone" }];
              await updateDoc(doc(db, "siteContent", "main"), {
                "contact.phones": newPhones,
              });
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 1rem",
              backgroundColor: "rgba(76, 175, 80, 0.1)",
              border: "1px solid rgba(76, 175, 80, 0.3)",
              borderRadius: "4px",
              color: "#4CAF50",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: "500",
            }}
          >
            + Add Phone
          </button>
          <button
            type="button"
            onClick={async () => {
              const { db, doc, updateDoc, getDoc } = await import("firebase/firestore");
              if (!db) return;
              const contentSnap = await getDoc(doc(db, "siteContent", "main"));
              if (!contentSnap.exists()) return;
              const data = contentSnap.data();
              const newEmails = [...(data.contact?.emails || []), { address: "", label: "Email" }];
              await updateDoc(doc(db, "siteContent", "main"), {
                "contact.emails": newEmails,
              });
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 1rem",
              backgroundColor: "rgba(76, 175, 80, 0.1)",
              border: "1px solid rgba(76, 175, 80, 0.3)",
              borderRadius: "4px",
              color: "#4CAF50",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: "500",
            }}
          >
            + Add Email
          </button>
        </div>
      )}
    </aside>
  );
}
