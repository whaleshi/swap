"use client";

import { FC, useState, useEffect } from "react";
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerBody, 
  DrawerFooter 
} from "@heroui/drawer";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { useTheme } from "next-themes";
import { useDisclosure } from "@heroui/modal";
import { SunFilledIcon, MoonFilledIcon } from "@/components/icons";

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

export interface ThemeSettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeSettingsDrawer: FC<ThemeSettingsDrawerProps> = ({ 
  isOpen, 
  onClose 
}) => {
  const { theme, setTheme } = useTheme();
  const [selectedThemeColor, setSelectedThemeColor] = useState<string>("blue-theme");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedThemeColor = localStorage.getItem("theme-color") || "blue-theme";
    setSelectedThemeColor(savedThemeColor);
    applyThemeColor(savedThemeColor);
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

  const handleThemeColorChange = (value: string) => {
    setSelectedThemeColor(value);
    applyThemeColor(value);
  };

  const handleDarkModeToggle = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
  };

  if (!mounted) {
    return null;
  }

  return (
    <Drawer 
      isOpen={isOpen} 
      onClose={onClose}
      placement="right"
      size="sm"
    >
      <DrawerContent>
        <DrawerHeader className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">主题设置</h2>
          <p className="text-sm text-default-500">自定义你的界面外观</p>
        </DrawerHeader>
        
        <DrawerBody className="space-y-6">
          {/* 明暗模式切换 */}
          <div className="space-y-3">
            <h3 className="text-md font-medium text-foreground">明暗模式</h3>
            <div className="flex gap-3">
              <Card 
                isPressable
                onPress={() => setTheme("light")}
                className={`flex-1 cursor-pointer transition-all ${
                  theme === "light" 
                    ? "ring-2 ring-primary shadow-lg" 
                    : "hover:shadow-md"
                }`}
              >
                <CardBody className="p-4 text-center">
                  <SunFilledIcon size={24} className="mx-auto mb-2 text-amber-500" />
                  <p className="text-sm font-medium">浅色</p>
                </CardBody>
              </Card>
              
              <Card 
                isPressable
                onPress={() => setTheme("dark")}
                className={`flex-1 cursor-pointer transition-all ${
                  theme === "dark" 
                    ? "ring-2 ring-primary shadow-lg" 
                    : "hover:shadow-md"
                }`}
              >
                <CardBody className="p-4 text-center">
                  <MoonFilledIcon size={24} className="mx-auto mb-2 text-blue-400" />
                  <p className="text-sm font-medium">深色</p>
                </CardBody>
              </Card>
            </div>
          </div>

          <Divider />

          {/* 主题色彩选择 */}
          <div className="space-y-3">
            <h3 className="text-md font-medium text-foreground">主题色彩</h3>
            <div className="grid grid-cols-2 gap-3">
              {themeColors.map((themeColor) => (
                <Card
                  key={themeColor.key}
                  isPressable
                  onPress={() => handleThemeColorChange(themeColor.key)}
                  className={`cursor-pointer transition-all ${
                    selectedThemeColor === themeColor.key
                      ? "ring-2 ring-offset-2 ring-offset-background shadow-lg scale-105"
                      : "hover:shadow-md hover:scale-102"
                  }`}
                  style={{
                    ringColor: selectedThemeColor === themeColor.key ? themeColor.color : undefined
                  }}
                >
                  <CardBody className="p-4 text-center">
                    <div
                      className="w-8 h-8 rounded-full mx-auto mb-2 border-2 border-white shadow-sm"
                      style={{ backgroundColor: themeColor.color }}
                    />
                    <p className="text-sm font-medium">{themeColor.label}</p>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>

          <Divider />

          {/* 预览区域 */}
          <div className="space-y-3">
            <h3 className="text-md font-medium text-foreground">预览</h3>
            <Card>
              <CardBody className="p-4 space-y-3">
                <div className="flex gap-2">
                  <Button color="primary" size="sm">
                    主要按钮
                  </Button>
                  <Button color="secondary" size="sm">
                    次要按钮
                  </Button>
                </div>
                <p className="text-sm text-default-600">
                  这是当前主题下的文本样式预览
                </p>
              </CardBody>
            </Card>
          </div>
        </DrawerBody>

        <DrawerFooter>
          <Button color="danger" variant="light" onPress={onClose}>
            关闭
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};