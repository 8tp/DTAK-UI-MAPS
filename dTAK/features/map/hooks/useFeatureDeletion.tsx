import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

type DeletableFeature = {
    id: string;
    type: "circle" | string;
    delete: () => void;
};

type FeatureDeletionContextValue = {
    selected: DeletableFeature | undefined;
    select: (feature: DeletableFeature | undefined) => void;
};

const FeatureDeletionContext = createContext<FeatureDeletionContextValue | undefined>(undefined);

export const FeatureDeletionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [selected, setSelected] = useState<DeletableFeature | undefined>(undefined);

    const value = useMemo(() => ({
        selected,
        select: setSelected,
    }), [selected]);

    return (
        <FeatureDeletionContext.Provider value={value}>
            {children}
        </FeatureDeletionContext.Provider>
    );
};

export function useFeatureDeletion() {
    const ctx = useContext(FeatureDeletionContext);
    if (!ctx) throw new Error("useFeatureDeletion must be used within FeatureDeletionProvider");
    return ctx;
}


