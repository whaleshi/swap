"use client";

import { FC, useState, useEffect } from "react";
import { Select, SelectItem } from "@heroui/select";
import { Card, CardBody } from "@heroui/card";

interface ThemeColorOption {
  key: string;
  label: string;
  color: string;
}

const themeColors: ThemeColorOption[] = [
  { key: "blue-theme", label: "蓝色", color: "#3b82f6" },
  { key: "green-theme", label: "绿色", color: "#22c55e" },
  { key: "purple-theme", label: "紫色", color: "#a855f7" },
  { key: "orange-theme", label: "橙色", color: "#f97316" },
  { key: "pink-theme", label: "粉色", color: "#ec4899" },
];

export interface ThemeColorSwitchProps {
  className?: string;
}

export const ThemeColorSwitch: FC<ThemeColorSwitchProps> = ({ className }) => {
  const [selectedTheme, setSelectedTheme] = useState<string>("blue-theme");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("theme-color") || "blue-theme";
    setSelectedTheme(savedTheme);
    applyThemeColor(savedTheme);
  }, []);

  const applyThemeColor = (themeColor: string) => {
    const htmlElement = document.documentElement;
    
    // 移除所有主题色类
    themeColors.forEach(theme => {
      htmlElement.classList.remove(theme.key);
    });
    
    // 添加新的主题色类
    htmlElement.classList.add(themeColor);
    
    // 保存到localStorage
    localStorage.setItem("theme-color", themeColor);
  };

  const handleThemeChange = (value: string) => {
    setSelectedTheme(value);
    applyThemeColor(value);
  };

  if (!mounted) {
    return null;
  }

  return (
    <Card className={className}>
      <CardBody className="p-4">
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">主题色彩</h3>
          <Select
            label="选择主题色"
            placeholder="选择一个主题色"
            selectedKeys={[selectedTheme]}
            onSelectionChange={(keys) => {
              const selectedKey = Array.from(keys)[0] as string;
              if (selectedKey) {
                handleThemeChange(selectedKey);
              }
            }}
            className="max-w-xs"
          >
            {themeColors.map((themeColor) => (
              <SelectItem
                key={themeColor.key}
                value={themeColor.key}
                startContent={
                  <div
                    className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: themeColor.color }}
                  />
                }
              >
                {themeColor.label}
              </SelectItem>
            ))}
          </Select>
          
          <div className="flex gap-2 flex-wrap">
            {themeColors.map((themeColor) => (
              <button
                key={themeColor.key}
                onClick={() => handleThemeChange(themeColor.key)}
                className={`w-8 h-8 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
                  selectedTheme === themeColor.key
                    ? "border-white shadow-lg scale-110"
                    : "border-gray-300 hover:border-white"
                }`}
                style={{ backgroundColor: themeColor.color }}
                title={themeColor.label}
              />
            ))}
          </div>
        </div>
      </CardBody>
    </Card>
  );
};