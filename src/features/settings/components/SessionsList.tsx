"use client";

import { useMemo, useState, useTransition } from "react";

import { logoutOthers, revokeSession } from "@/features/settings/actions/security";
import { sessionActionInitialState } from "@/features/settings/types/schemas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";

type SessionRow = {
  sessionToken: string;
  userAgent: string | null;
  ipAddress: string | null;
  updatedAt: string;
};

type SessionsListProps = {
  sessions: SessionRow[];
  currentSessionToken: string | null;
};

function parseUserAgent(userAgent: string | null): { browser: string; device: string } {
  if (!userAgent) {
    return { browser: "Unknown Browser", device: "Unknown Device" };
  }

  const ua = userAgent.toLowerCase();

  let browser = "Unknown Browser";
  if (ua.includes("edg/")) browser = "Microsoft Edge";
  else if (ua.includes("chrome/")) browser = "Google Chrome";
  else if (ua.includes("safari/") && !ua.includes("chrome/")) browser = "Safari";
  else if (ua.includes("firefox/")) browser = "Firefox";

  let device = "Desktop";
  if (ua.includes("iphone") || ua.includes("android") || ua.includes("mobile")) {
    device = "Mobile";
  } else if (ua.includes("ipad") || ua.includes("tablet")) {
    device = "Tablet";
  }

  return { browser, device };
}

export function SessionsList({ sessions, currentSessionToken }: SessionsListProps) {
  const [rows, setRows] = useState(sessions);
  const [isRevokePending, startRevokeTransition] = useTransition();
  const [isLogoutOthersPending, startLogoutOthersTransition] = useTransition();
  const { toast } = useToast();

  const otherSessionsCount = useMemo(
    () => rows.filter((row) => row.sessionToken !== currentSessionToken).length,
    [rows, currentSessionToken]
  );

  const handleRevoke = (sessionToken: string) => {
    const payload = new FormData();
    payload.set("sessionToken", sessionToken);

    startRevokeTransition(async () => {
      const result = await revokeSession(sessionActionInitialState, payload);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      setRows((prev) => prev.filter((row) => row.sessionToken !== sessionToken));
      toast.success(result.message);
    });
  };

  const handleLogoutOthers = () => {
    startLogoutOthersTransition(async () => {
      const result = await logoutOthers(sessionActionInitialState, new FormData());

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      setRows((prev) => prev.filter((row) => row.sessionToken === currentSessionToken));
      toast.success(result.message);
    });
  };

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>
            Review devices that are signed in and revoke any session you do not recognize.
          </CardDescription>
        </div>
        <Button
          onClick={handleLogoutOthers}
          disabled={isLogoutOthersPending || otherSessionsCount === 0}
        >
          {isLogoutOthersPending ? "Logging out..." : "Logout from all other devices"}
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Device / Browser</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const parsed = parseUserAgent(row.userAgent);
              const isCurrent = row.sessionToken === currentSessionToken;

              return (
                <TableRow key={row.sessionToken}>
                  <TableCell className="space-y-1">
                    <div className="font-medium text-slate-900">{parsed.browser}</div>
                    <div className="text-xs text-slate-500">{parsed.device}</div>
                  </TableCell>
                  <TableCell>{new Date(row.updatedAt).toLocaleString()}</TableCell>
                  <TableCell>{row.ipAddress ?? "Unknown"}</TableCell>
                  <TableCell className="text-right">
                    {isCurrent ? (
                      <Badge variant="outline">This Device</Badge>
                    ) : (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" disabled={isRevokePending}>
                            Revoke
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent size="sm">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Revoke this session?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This device will be signed out immediately.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              variant="destructive"
                              onClick={() => handleRevoke(row.sessionToken)}
                            >
                              Revoke Session
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
