import type { TheoryBlock } from "@/lib/types/lesson";

type TheoryBlocksProps = {
  blocks: TheoryBlock[];
};

export function TheoryBlocks({ blocks }: TheoryBlocksProps) {
  return (
    <div className="space-y-5">
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          return (
            <h3
              key={`${block.type}-${index}`}
              className="pt-1 text-lg font-semibold tracking-tight text-ink"
            >
              {block.content}
            </h3>
          );
        }

        if (block.type === "list") {
          const ListTag = block.ordered ? "ol" : "ul";
          return (
            <ListTag
              key={`${block.type}-${index}`}
              className={`space-y-2.5 pl-5 text-[15px] leading-relaxed text-ink/85 ${
                block.ordered ? "list-decimal" : "list-disc"
              }`}
            >
              {block.items.map((item) => (
                <li key={item} className="pl-1">
                  {item}
                </li>
              ))}
            </ListTag>
          );
        }

        return (
          <p
            key={`${block.type}-${index}`}
            className="text-[15px] leading-relaxed text-ink/85 sm:text-base"
          >
            {block.content}
          </p>
        );
      })}
    </div>
  );
}
