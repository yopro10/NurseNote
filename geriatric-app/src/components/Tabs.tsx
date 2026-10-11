import { ReactNode } from 'react';

interface Tab {
  id: string;
  label: string;
  content: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
}

export default function Tabs({ tabs, defaultTab }: TabsProps) {
  const [activeTab, setActiveTab] = React.useState(defaultTab || tabs[0]?.id);

  return (
    <div className="tabs">
      <div className="tabs__header" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            className={`tabs__tab ${activeTab === tab.id ? 'tabs__tab--activo' : ''}`}
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="tabs__content">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`tabs__panel ${activeTab === tab.id ? 'tabs__panel--activo' : ''}`}
            role="tabpanel"
            hidden={activeTab !== tab.id}
          >
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  );
}
