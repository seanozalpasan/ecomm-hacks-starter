"use client";

import { animate, motion, useMotionValue, useTransform } from "motion/react";
import Image from "next/image";
import { useEffect, useState } from "react";

interface User {
	userImage: string;
	id?: string | number;
}

interface CircularUserImagesProps {
	users: User[];
	size?: number; // Size of each image in pixels
	radius?: number; // Radius of the circle in pixels
}

interface UserImageProps {
	user: User;
	index: number;
	baseAngle: number;
	rotation: ReturnType<typeof useMotionValue<number>>;
	size: number;
	radius: number;
}

function UserImage({
	user,
	index,
	baseAngle,
	rotation,
	size,
	radius,
}: UserImageProps) {
	const [imageLoaded, setImageLoaded] = useState(false);

	// Calculate x and y positions based on rotation
	const x = useTransform(rotation, (r) => {
		const currentAngle = baseAngle + (r * Math.PI) / 180;
		return radius * Math.cos(currentAngle) + radius;
	});

	const y = useTransform(rotation, (r) => {
		const currentAngle = baseAngle + (r * Math.PI) / 180;
		return radius * Math.sin(currentAngle) + radius;
	});

	return (
		<motion.div
			key={user.id || index}
			className="absolute hover:scale-110 hover:z-10"
			style={{
				left: x,
				top: y,
				width: `${size}px`,
				height: `${size}px`,
			}}
			transition={{
				type: "spring",
				stiffness: 300,
				damping: 30,
			}}
		>
			<div className="relative w-full h-full overflow-hidden rounded-lg shadow-lg">
				{/* Blurred placeholder */}
				{!imageLoaded && (
					<motion.div
						initial={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
						className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400 blur-sm"
					/>
				)}
				{/* Actual image */}
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: imageLoaded ? 1 : 0 }}
					transition={{ duration: 0.3 }}
					className="absolute inset-0"
				>
					<Image
						src={user.userImage}
						alt="User avatar"
						fill
						className="object-cover"
						sizes={`${size}px`}
						onLoad={() => setImageLoaded(true)}
					/>
				</motion.div>
			</div>
		</motion.div>
	);
}

export default function CircularUserImages({
	users,
	size = 64,
	radius = 120,
}: CircularUserImagesProps) {
	const rotation = useMotionValue(0);

	useEffect(() => {
		const animation = animate(rotation, -360, {
			duration: 20,
			repeat: Infinity,
			ease: "linear",
		});

		return () => animation.stop();
	}, [rotation]);

	if (!users || users.length === 0) {
		return null;
	}

	const angleStep = (2 * Math.PI) / users.length;

	return (
		<div
			className="relative mx-auto"
			style={{
				width: `${radius * 2 + size}px`,
				height: `${radius * 2 + size}px`,
			}}
		>
			{users.map((user, index) => {
				const baseAngle = index * angleStep - Math.PI / 2;

				return (
					<UserImage
						key={user.id || index}
						user={user}
						index={index}
						baseAngle={baseAngle}
						rotation={rotation}
						size={size}
						radius={radius}
					/>
				);
			})}
		</div>
	);
}
