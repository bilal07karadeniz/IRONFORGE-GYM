"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Edit, Trash2 } from "lucide-react";

interface Column<T> {
    header: string;
    accessorKey: keyof T | ((item: T) => React.ReactNode);
    className?: string;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    onEdit?: (item: T) => void;
    onDelete?: (item: T) => void;
    isLoading?: boolean;
}

export function DataTable<T extends { id: string }>({
    data,
    columns,
    onEdit,
    onDelete,
    isLoading
}: DataTableProps<T>) {
    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Loading data...</div>;
    }

    if (data.length === 0) {
        return <div className="p-8 text-center text-muted-foreground">No records found</div>;
    }

    return (
        <div className="rounded-md border border-border">
            <Table>
                <TableHeader>
                    <TableRow>
                        {columns.map((column, index) => (
                            <TableHead key={index} className={column.className}>
                                {column.header}
                            </TableHead>
                        ))}
                        {(onEdit || onDelete) && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((item) => (
                        <TableRow key={item.id}>
                            {columns.map((column, index) => (
                                <TableCell key={index} className={column.className}>
                                    {(typeof column.accessorKey === 'function'
                                        ? column.accessorKey(item)
                                        // @ts-ignore - simple accessor
                                        : item[column.accessorKey]
                                    ) as React.ReactNode}
                                </TableCell>
                            ))}
                            {(onEdit || onDelete) && (
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        {onEdit && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onEdit(item)}
                                                title="Edit"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        )}
                                        {onDelete && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onDelete(item)}
                                                className="text-destructive hover:text-destructive"
                                                title="Delete"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            )}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
