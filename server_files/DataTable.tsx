"use client";

import * as React from "react";
import { useState } from "react"; // Import useState hook
import wss from "./webSocketService.js";

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [rowSelection, setRowSelection] = React.useState({});

  // State to store information retrieved from WebSocket
  const [webSocketData, setWebSocketData] = useState<string>("");

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
  });

  // Function to handle retrieval of information from WebSocket
  const retrieveDataFromWebSocket = () => {
    // Replace 'ws://localhost:5173' with your WebSocket server URL
    const ws = new WebSocket('ws://localhost:5174');

    ws.onopen = () => {
      console.log('WebSocket connection established');
      ws.send('GET_DATA'); // Send request to WebSocket server
      console.log("finished sending")
    };

    ws.onmessage = (event) => {
      console.log('Received data from WebSocket:', event.data);
      // Define a regular expression pattern to match the value of the "data" key
      const data = /"data":"([^"]+)"/;
        
      // Use the exec() method to search for the pattern in the JSON string
      const match = data.exec(event.data.toString());

      // Check if a match is found
      if (match && match.length > 1) {
          // The value is captured in the first capturing group (index 1)
          const dataValue = match[1];
          console.log("Extracted data value:", dataValue);
          // peerIds.push(dataValue)
          setWebSocketData(dataValue); // Update state with retrieved data
      } else {
          console.log("No match found");
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  };


  return (
    <div>
      {/* Button to retrieve information from WebSocket */}
      <Button onClick={retrieveDataFromWebSocket}>Retrieve Data</Button>
      {/* Display retrieved data */}
      <p>WebSocket Data: {webSocketData}</p>

      <div className="flex py-4">
        <Input
          placeholder="Filter regions..."
          value={(table.getColumn("region")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("region")?.setFilterValue(event.target.value)
          }
          className="max-w-sm inline"
        />
        <Button type="submit">Filter</Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
