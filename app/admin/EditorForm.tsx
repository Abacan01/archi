"use client";

import React, { useState } from "react";
import { IconTrash, IconPlus, IconLayers, IconUpload } from "./icons";

interface EditorFormProps {
  data: any;
  onChange: (newData: any) => void;
  onUploadRequest?: (currentPath: string, callback: (url: string) => void) => void;
}

export function EditorForm({ data, onChange, onUploadRequest }: EditorFormProps) {
  const [activeTab, setActiveTab] = useState<string>(Object.keys(data || {})[0] || "");

  if (!data || typeof data !== "object") return null;

  const tabs = Object.keys(data);

  return (
    <div className="admin-editor-wrap">
      <div className="admin-editor-tabs">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`admin-tab ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.replace(/([A-Z])/g, " $1").toUpperCase()}
          </button>
        ))}
      </div>
      <div className="admin-editor-content">
        {activeTab && (
          <ObjectEditor
            value={data[activeTab]}
            path={activeTab}
            onChange={(newVal: any) => onChange({ ...data, [activeTab]: newVal })}
            onUploadRequest={onUploadRequest}
          />
        )}
      </div>
    </div>
  );
}

function ObjectEditor({ value, path, onChange, onUploadRequest }: any) {
  if (Array.isArray(value)) {
    return <ArrayEditor value={value} path={path} onChange={onChange} onUploadRequest={onUploadRequest} />;
  }

  if (value !== null && typeof value === "object") {
    return (
      <div className="admin-object-editor">
        {Object.keys(value).map((key) => (
          <div key={key} className="admin-form-group">
            <label className="admin-field-label">{key.replace(/([A-Z])/g, " $1").replace(/^./, (str: string) => str.toUpperCase())}</label>
            <FieldEditor
              value={value[key]}
              fieldKey={key}
              path={`${path}.${key}`}
              onChange={(newVal: any) => onChange({ ...value, [key]: newVal })}
              onUploadRequest={onUploadRequest}
            />
          </div>
        ))}
      </div>
    );
  }

  return <FieldEditor value={value} fieldKey="" path={path} onChange={onChange} onUploadRequest={onUploadRequest} />;
}

function ArrayEditor({ value, path, onChange, onUploadRequest }: any) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handleUpdate = (index: number, newVal: any) => {
    const next = [...value];
    next[index] = newVal;
    onChange(next);
  };

  const handleRemove = (index: number) => {
    const next = [...value];
    next.splice(index, 1);
    onChange(next);
  };

  const handleAdd = () => {
    const next = [...value];
    // try to guess empty item shape from first item if it exists
    let emptyItem: any = "";
    if (value.length > 0) {
      if (typeof value[0] === "object") {
        emptyItem = Object.fromEntries(Object.keys(value[0]).map(k => [k, ""]));
      }
    }
    next.push(emptyItem);
    onChange(next);
    setExpandedIndex(next.length - 1);
  };

  const isScalarArray = value.length > 0 && typeof value[0] !== "object";

  return (
    <div className="admin-array-editor">
      {value.map((item: any, i: number) => {
        const isExpanded = expandedIndex === i || isScalarArray;
        return (
          <div key={i} className="admin-array-item">
            {!isScalarArray && (
              <div 
                className="admin-array-item-header" 
                onClick={() => setExpandedIndex(isExpanded ? null : i)}
              >
                <div className="admin-array-item-title">
                  <IconLayers />
                  Item {i + 1} {item.title || item.name || item.label ? `- ${item.title || item.name || item.label}` : ""}
                </div>
                <button type="button" className="btn-icon danger" onClick={(e) => { e.stopPropagation(); handleRemove(i); }}>
                  <IconTrash />
                </button>
              </div>
            )}
            {isExpanded && (
              <div className={!isScalarArray ? "admin-array-item-body" : "admin-array-item-scalar"}>
                {isScalarArray && (
                  <button type="button" className="btn-icon danger" onClick={() => handleRemove(i)}>
                    <IconTrash />
                  </button>
                )}
                <div style={{ flex: 1 }}>
                  <ObjectEditor
                    value={item}
                    path={`${path}[${i}]`}
                    onChange={(newVal: any) => handleUpdate(i, newVal)}
                    onUploadRequest={onUploadRequest}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
      <button type="button" className="btn btn-outline admin-add-btn" onClick={handleAdd}>
        <IconPlus /> Add Item
      </button>
    </div>
  );
}

function FieldEditor({ value, fieldKey, path, onChange, onUploadRequest }: any) {
  // If a nested object is passed as a field value, render ObjectEditor recursively
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    return (
      <div style={{ paddingLeft: 0 }}>
        <ObjectEditor value={value} path={path} onChange={onChange} onUploadRequest={onUploadRequest} />
      </div>
    );
  }
  const isImageUrl = fieldKey.toLowerCase().endsWith("url") || fieldKey.toLowerCase().endsWith("image") || fieldKey.toLowerCase().endsWith("src");

  if (typeof value === "boolean") {
    return (
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        className="admin-checkbox"
      />
    );
  }

  if (typeof value === "number") {
    return (
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="admin-input-text"
      />
    );
  }

  if (isImageUrl && onUploadRequest) {
    return (
      <div className="admin-upload-field">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="admin-input-text"
          placeholder="/assets/images/..."
        />
        <button
          type="button"
          className="btn btn-outline admin-inline-upload"
          onClick={() => onUploadRequest(path, onChange)}
        >
          <IconUpload /> Upload
        </button>
      </div>
    );
  }

  // Multiline string
  if (typeof value === "string" && (value.length > 60 || fieldKey.toLowerCase().includes("paragraph") || fieldKey.toLowerCase().includes("text"))) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="admin-textarea"
        rows={4}
      />
    );
  }

  return (
    <input
      type="text"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className="admin-input-text"
    />
  );
}
