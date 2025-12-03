import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import SignIn from "./signin";
import { BrowserRouter } from "react-router-dom";
import * as firebaseAuth from "firebase/auth";
import Auth from "../api/auth.module";
import { toast } from "react-toastify";

// Mock dependencies
vi.mock("firebase/auth", async () => {
  const actual = await vi.importActual("firebase/auth");
  return {
    ...actual,
    signInWithEmailAndPassword: vi.fn(),
  };
});

vi.mock("../api/firebase", () => ({
  auth: {},
}));

vi.mock("../api/auth.module", () => ({
  default: {
    authenticateUser: vi.fn(),
  },
}));

vi.mock("react-toastify", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockedNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  };
});

describe("SignIn Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders sign in form", () => {
    render(
      <BrowserRouter>
        <SignIn />
      </BrowserRouter>
    );

    expect(screen.getByText("Login")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in/i })
    ).toBeInTheDocument();
  });

  test("validates required fields", async () => {
    render(
      <BrowserRouter>
        <SignIn />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getAllByText("Required")).toHaveLength(2);
    });
  });

  test("handles successful login", async () => {
    const mockUser = {
      getIdToken: vi.fn().mockResolvedValue("mock-token"),
    };
    (firebaseAuth.signInWithEmailAndPassword as any).mockResolvedValue({
      user: mockUser,
    });

    render(
      <BrowserRouter>
        <SignIn />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByPlaceholderText("Email"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(firebaseAuth.signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        "test@example.com",
        "password123"
      );
      expect(Auth.authenticateUser).toHaveBeenCalledWith({
        accessToken: "mock-token",
        data: mockUser,
      });
      expect(toast.success).toHaveBeenCalledWith(
        "Login successful!",
        expect.any(Object)
      );
      expect(mockedNavigate).toHaveBeenCalledWith("/home");
    });
  });

  test("handles login failure", async () => {
    (firebaseAuth.signInWithEmailAndPassword as any).mockRejectedValue(
      new Error("Invalid credentials")
    );

    render(
      <BrowserRouter>
        <SignIn />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByPlaceholderText("Email"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "wrongpassword" },
    });

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Login failed: Invalid credentials",
        expect.any(Object)
      );
    });
  });
});
