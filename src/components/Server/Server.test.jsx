import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Server from "./Server";

function renderServer(overrides = {}) {
    const defaultProps = {
        server: "192.168.1.10:27015",
        map: "de_dust2",
        team1: "8",
        team2: "5",
        rounds: "13",
        admin: false,
        players1: ["Player1", "Player2"],
        players2: ["Player3", "Player4"],
        wsClient: { current: { send: jest.fn() } },
        isConnected: true,
        ...overrides,
    };
    return { ...render(<Server {...defaultProps} />), props: defaultProps };
}

describe("Server component", () => {
    test("renders server IP, scores, and map", () => {
        renderServer();
        expect(screen.getByText(/192\.168\.1\.10:27015/)).toBeInTheDocument();
        expect(screen.getByText("8")).toBeInTheDocument();
        expect(screen.getByText("5")).toBeInTheDocument();
        expect(screen.getByText("de_dust2")).toBeInTheDocument();
    });

    test("player dropdown is hidden by default", () => {
        renderServer();
        expect(screen.queryByText("Counter-Terrorists")).not.toBeVisible();
        expect(screen.queryByText("Terrorists")).not.toBeVisible();
    });

    test("clicking expander toggles player dropdown", () => {
        renderServer();
        const divider = screen.getByText(":");
        fireEvent.click(divider);
        expect(screen.getByText("Counter-Terrorists")).toBeVisible();
        expect(screen.getByText("Player1")).toBeVisible();
        expect(screen.getByText("Player3")).toBeVisible();
    });

    test("shows OK icon when admin flag is false", () => {
        renderServer({ admin: false });
        expect(screen.getByText("🆗")).toBeInTheDocument();
    });

    test("shows alert icon when admin flag is true", () => {
        renderServer({ admin: true });
        expect(screen.getByText("❗")).toBeInTheDocument();
    });

    test("sends ADMIN_SWITCH via WebSocket when connected and clicked", () => {
        const { props } = renderServer({ admin: false, isConnected: true });
        const okBtn = screen.getByText("🆗");
        fireEvent.click(okBtn);

        expect(props.wsClient.current.send).toHaveBeenCalledTimes(1);
        const sent = JSON.parse(props.wsClient.current.send.mock.calls[0][0]);
        expect(sent.type).toBe("ADMIN_SWITCH");
        expect(sent.payload.ServerKey).toBe("192.168.1.10:27015");
        expect(sent.payload.flag).toBe(true);
    });

    test("does NOT send WebSocket message when disconnected", () => {
        const { props } = renderServer({ isConnected: false });
        const okBtn = screen.getByText("🆗");
        fireEvent.click(okBtn);

        expect(props.wsClient.current.send).not.toHaveBeenCalled();
    });

    test("shows disabled styling when disconnected", () => {
        renderServer({ isConnected: false });
        const notification = screen.getByText("🆗");
        expect(notification).toHaveStyle({ opacity: 0.4, cursor: "not-allowed" });
        expect(notification).not.toHaveClass("pointer");
    });

    test("shows pointer class when connected", () => {
        renderServer({ isConnected: true });
        const notification = screen.getByText("🆗");
        expect(notification).toHaveClass("pointer");
    });
});
